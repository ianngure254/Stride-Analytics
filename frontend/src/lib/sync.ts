import { db, type SyncQueue } from './db';
import { getAuthToken } from '../pages/Firebase/authHelpers';

type TableName = 'products' | 'customers' | 'sales' | 'saleItems' | 'payments' | 'credits';

class SyncService {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private dbAvailable: boolean = true;

  constructor() {
    this.setupEventListeners();
    this.checkDBAvailability();
  }

  private async checkDBAvailability() {
    try {
      await db.products.count();
      this.dbAvailable = true;
    } catch (error) {
      console.error('IndexedDB not available:', error);
      this.dbAvailable = false;
    }
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.sync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  async addToQueue<T>(tableName: TableName, operation: 'create' | 'update' | 'delete', data: T): Promise<void> {
    if (!this.dbAvailable) {
      console.warn('IndexedDB not available, skipping sync queue');
      return;
    }
    try {
      await db.syncQueue.add({
        tableName,
        operation,
        data,
        timestamp: new Date().toISOString(),
        retryCount: 0
      });
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
    }
  }

  async sync(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || !this.dbAvailable) {
      return;
    }

    this.syncInProgress = true;

    try {
      const queue = await db.syncQueue.toArray();
      
      for (const item of queue) {
        try {
          await this.processQueueItem(item);
          await db.syncQueue.delete(item.id!);
        } catch (error) {
          console.error('Sync failed for item:', item, error);
          
          // Update retry count
          await db.syncQueue.update(item.id!, {
            retryCount: item.retryCount + 1
          });

          // Remove if too many retries
          if (item.retryCount >= 3) {
            console.warn(`Removing sync item after 3 retries:`, item);
            await db.syncQueue.delete(item.id!);
          }
        }
      }

      // Pull latest data from server
      await this.pullFromServer();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processQueueItem(item: SyncQueue): Promise<void> {
    const { tableName, operation, data } = item;

    switch (operation) {
      case 'create':
        await this.createServerRecord(tableName as TableName, data);
        break;
      case 'update':
        await this.updateServerRecord(tableName as TableName, data);
        break;
      case 'delete':
        await this.deleteServerRecord(tableName as TableName, data);
        break;
    }
  }

  private async createServerRecord(tableName: TableName, data: any): Promise<void> {
    const token = await getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`/api/${tableName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create record on server' }));
      throw new Error(error.error || 'Failed to create record on server');
    }

    const result = await response.json();
    
    // Update local record with server ID
    const table = db[tableName as keyof typeof db] as any;
    await table.update(data.id, { id: result.id, _synced: true });
  }

  private async updateServerRecord(tableName: TableName, data: any): Promise<void> {
    const token = await getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`/api/${tableName}/${data.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update record on server' }));
      throw new Error(error.error || 'Failed to update record on server');
    }

    const table = db[tableName as keyof typeof db] as any;
    await table.update(data.id, { _synced: true });
  }

  private async deleteServerRecord(tableName: TableName, data: any): Promise<void> {
    const token = await getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`/api/${tableName}/${data.id}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete record on server' }));
      throw new Error(error.error || 'Failed to delete record on server');
    }

    const table = db[tableName as keyof typeof db] as any;
    await table.delete(data.id);
  }

  private async pullFromServer(): Promise<void> {
    const token = await getAuthToken();
    const tables: TableName[] = ['products', 'customers', 'sales', 'saleItems', 'payments', 'credits'];

    for (const tableName of tables) {
      try {
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(`/api/${tableName}?sync=true`, { headers });
        if (!response.ok) continue;

        const serverData = await response.json();
        const table = db[tableName as keyof typeof db] as any;

        // Upsert data from server
        for (const record of serverData) {
          try {
            const existing = await table.get(record.id);
            if (existing) {
              // Only update if server version is newer
              if (new Date(record.updatedAt) > new Date(existing.updatedAt)) {
                await table.put({ ...record, _synced: true });
              }
            } else {
              await table.put({ ...record, _synced: true });
            }
          } catch (error) {
            console.error(`Failed to upert record in ${tableName}:`, error);
          }
        }
      } catch (error) {
        console.error(`Failed to pull ${tableName}:`, error);
      }
    }
  }

  async getQueueCount(): Promise<number> {
    if (!this.dbAvailable) return 0;
    try {
      return await db.syncQueue.count();
    } catch (error) {
      console.error('Failed to get queue count:', error);
      return 0;
    }
  }

  async getLastSyncTime(): Promise<string | null> {
    if (!this.dbAvailable) return null;
    try {
      const lastItem = await db.syncQueue.orderBy('timestamp').last();
      return lastItem ? lastItem.timestamp : null;
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return null;
    }
  }
}

export const syncService = new SyncService();
