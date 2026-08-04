import { Request, Response } from 'express';
import { syncService } from './sync.service';

export class SyncController {
  async pullData(req: Request, res: Response) {
    try {
      const { table } = req.params;
      const { lastSync } = req.query;

      if (!table) {
        return res.status(400).json({ error: 'Table parameter is required' });
      }

      // Handle table parameter that can be string | string[]
      const tableString = Array.isArray(table) ? table[0] : table;

      const validTables = ['products', 'customers', 'sales', 'saleItems', 'payments', 'credits'];
      if (!validTables.includes(tableString)) {
        return res.status(400).json({ error: 'Invalid table name' });
      }

      // Handle query parameter that can be string | string[] | ParsedQs
      let lastSyncString: string | undefined;
      if (Array.isArray(lastSync)) {
        lastSyncString = String(lastSync[0]);
      } else if (typeof lastSync === 'string') {
        lastSyncString = lastSync;
      }
      const data = await syncService.getTableData(tableString, lastSyncString);
      res.json(data);
    } catch (error) {
      console.error('Sync pull error:', error);
      res.status(500).json({ error: 'Failed to pull data' });
    }
  }

  async pushCreate(req: Request, res: Response) {
    try {
      const { table } = req.params;
      const data = req.body;

      if (!table || !data) {
        return res.status(400).json({ error: 'Table and data are required' });
      }

      // Handle table parameter that can be string | string[]
      const tableString = Array.isArray(table) ? table[0] : table;
      const result = await syncService.createRecord(tableString, data);
      res.status(201).json(result);
    } catch (error) {
      console.error('Sync create error:', error);
      res.status(500).json({ error: 'Failed to create record' });
    }
  }

  async pushUpdate(req: Request, res: Response) {
    try {
      const { table, id } = req.params;
      const data = req.body;

      if (!table || !id || !data) {
        return res.status(400).json({ error: 'Table, id, and data are required' });
      }

      // Handle table parameter that can be string | string[]
      const tableString = Array.isArray(table) ? table[0] : table;
      // Handle id parameter that can be string | string[]
      const idString = Array.isArray(id) ? id[0] : id;
      const result = await syncService.updateRecord(tableString, parseInt(idString), data);
      res.json(result);
    } catch (error) {
      console.error('Sync update error:', error);
      res.status(500).json({ error: 'Failed to update record' });
    }
  }

  async pushDelete(req: Request, res: Response) {
    try {
      const { table, id } = req.params;

      if (!table || !id) {
        return res.status(400).json({ error: 'Table and id are required' });
      }

      // Handle table parameter that can be string | string[]
      const tableString = Array.isArray(table) ? table[0] : table;
      // Handle id parameter that can be string | string[]
      const idString = Array.isArray(id) ? id[0] : id;
      const result = await syncService.deleteRecord(tableString, parseInt(idString));
      res.json(result);
    } catch (error) {
      console.error('Sync delete error:', error);
      res.status(500).json({ error: 'Failed to delete record' });
    }
  }

  async getStatus(req: Request, res: Response) {
    try {
      // Return sync status information
      res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error) {
      console.error('Sync status error:', error);
      res.status(500).json({ error: 'Failed to get sync status' });
    }
  }
}

export const syncController = new SyncController();
