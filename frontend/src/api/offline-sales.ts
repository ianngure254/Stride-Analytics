import { db, type Sale as DBSale } from '../lib/db';
import { syncService } from '../lib/sync';
import * as salesApi from './sales';
import type { CreateSalePayload, UpdateSaleStatusPayload, Sale as APISale } from './sales';

export async function getSalesOffline(filters?: {
  startDate?: string;
  endDate?: string;
  customerId?: number;
}): Promise<{ data: APISale[] }> {
  try {
    // Try API first if online
    if (syncService.getOnlineStatus()) {
      const response = await salesApi.getSales(filters);
      
      // Update IndexedDB with fresh data
      await db.sales.clear();
      const dbSales: DBSale[] = response.data.map(s => ({
        id: s.id,
        customerId: s.customerId,
        totalAmount: s.totalAmount.toString(),
        status: s.status,
        paymentMethod: s.paymentMethod,
        saleDate: s.saleDate,
        notes: s.notes || '',
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        _synced: true,
        _deleted: false
      }));
      await db.sales.bulkPut(dbSales);
      
      return response;
    }
  } catch (error) {
    console.log('API failed, falling back to IndexedDB:', error);
  }

  // Fallback to IndexedDB
  let sales = await db.sales.filter(s => !s._deleted).toArray();

  // Apply filters
  if (filters?.startDate || filters?.endDate) {
    sales = sales.filter(s => {
      const saleDate = new Date(s.saleDate);
      if (filters.startDate && saleDate < new Date(filters.startDate)) return false;
      if (filters.endDate && saleDate > new Date(filters.endDate)) return false;
      return true;
    });
  }

  if (filters?.customerId) {
    sales = sales.filter(s => s.customerId === filters.customerId);
  }

  const apiSales: APISale[] = sales.map(s => ({
    id: s.id!,
    customerId: s.customerId,
    totalAmount: s.totalAmount,
    status: s.status as 'pending' | 'completed' | 'cancelled',
    paymentMethod: s.paymentMethod,
    saleDate: s.saleDate,
    notes: s.notes,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    customerName: null,
    customerEmail: null
  }));

  return { data: apiSales };
}

export async function createSaleOffline(payload: CreateSalePayload): Promise<{ data: APISale }> {
  // Save to IndexedDB immediately
  const totalAmount = payload.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toString();
  
  const newSale: Omit<DBSale, 'id'> = {
    customerId: payload.customerId,
    totalAmount,
    status: 'pending' as 'pending' | 'completed' | 'cancelled',
    paymentMethod: payload.paymentMethod,
    saleDate: new Date().toISOString(),
    notes: payload.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _synced: false,
    _deleted: false
  };

  const id = await db.sales.add(newSale);
  const savedSale = await db.sales.get(id);

  if (!savedSale) {
    throw new Error('Failed to save sale to local database');
  }

  // Save sale items and deduct stock locally
  const savedItems = [];
  for (const item of payload.items) {
    const itemId = await db.saleItems.add({
      saleId: id,
      productId: item.productId,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      totalPrice: (item.quantity * item.unitPrice).toString(),
      createdAt: new Date().toISOString(),
      _synced: false,
      _deleted: false
    });
    const savedItem = await db.saleItems.get(itemId);
    if (savedItem) {
      savedItems.push(savedItem);
    }

    // Deduct stock from local product
    const product = await db.products.get(item.productId);
    if (product) {
      const newStock = Math.max(0, parseFloat(product.stock) - item.quantity);
      await db.products.update(item.productId, {
        stock: newStock.toString(),
        _synced: false
      });
      
      // Queue product stock update for sync
      await syncService.addToQueue('products', 'update', {
        ...product,
        id: item.productId,
        stock: newStock.toString()
      });
    }
  }

  // Queue for sync with items included
  await syncService.addToQueue('sales', 'create', { ...savedSale, id, items: savedItems });

  // Try to sync immediately if online
  if (syncService.getOnlineStatus()) {
    try {
      await syncService.sync();
      const synced = await db.sales.get(id);
      if (synced) {
        const apiSale: APISale = {
          id: synced.id!,
          customerId: synced.customerId,
          totalAmount: synced.totalAmount,
          status: synced.status as 'pending' | 'completed' | 'cancelled',
          paymentMethod: synced.paymentMethod,
          saleDate: synced.saleDate,
          notes: synced.notes,
          createdAt: synced.createdAt,
          updatedAt: synced.updatedAt,
          customerName: null,
          customerEmail: null
        };
        return { data: apiSale };
      }
    } catch (error) {
      console.log('Sync failed, sale saved locally:', error);
    }
  }

  const apiSale: APISale = {
    id: savedSale.id!,
    customerId: savedSale.customerId,
    totalAmount: savedSale.totalAmount,
    status: savedSale.status as 'pending' | 'completed' | 'cancelled',
    paymentMethod: savedSale.paymentMethod,
    saleDate: savedSale.saleDate,
    notes: savedSale.notes,
    createdAt: savedSale.createdAt,
    updatedAt: savedSale.updatedAt,
    customerName: null,
    customerEmail: null
  };
  return { data: apiSale };
}

export async function updateSaleStatusOffline(
  id: number,
  payload: UpdateSaleStatusPayload
): Promise<{ data: APISale }> {
  const existing = await db.sales.get(id);
  if (!existing) {
    throw new Error('Sale not found');
  }

  const updatedSale: DBSale = {
    ...existing,
    status: payload.status as 'pending' | 'completed' | 'cancelled',
    updatedAt: new Date().toISOString(),
    _synced: false
  };

  await db.sales.put(updatedSale);

  // Queue for sync
  await syncService.addToQueue('sales', 'update', updatedSale);

  // Try to sync immediately if online
  if (syncService.getOnlineStatus()) {
    try {
      await syncService.sync();
      const synced = await db.sales.get(id);
      if (synced) {
        const apiSale: APISale = {
          id: synced.id!,
          customerId: synced.customerId,
          totalAmount: synced.totalAmount,
          status: synced.status as 'pending' | 'completed' | 'cancelled',
          paymentMethod: synced.paymentMethod,
          saleDate: synced.saleDate,
          notes: synced.notes,
          createdAt: synced.createdAt,
          updatedAt: synced.updatedAt,
          customerName: null,
          customerEmail: null
        };
        return { data: apiSale };
      }
    } catch (error) {
      console.log('Sync failed, sale updated locally:', error);
    }
  }

  const apiSale: APISale = {
    id: updatedSale.id!,
    customerId: updatedSale.customerId,
    totalAmount: updatedSale.totalAmount,
    status: updatedSale.status as 'pending' | 'completed' | 'cancelled',
    paymentMethod: updatedSale.paymentMethod,
    saleDate: updatedSale.saleDate,
    notes: updatedSale.notes,
    createdAt: updatedSale.createdAt,
    updatedAt: updatedSale.updatedAt,
    customerName: null,
    customerEmail: null
  };
  return { data: apiSale };
}
