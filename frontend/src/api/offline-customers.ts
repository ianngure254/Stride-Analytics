import { db, type Customer as DBCustomer } from '../lib/db';
import { syncService } from '../lib/sync';
import * as customersApi from './customers';
import type { CreateCustomerPayload, UpdateCustomerPayload, Customer as APICustomer } from './customers';

export async function getCustomersOffline(): Promise<{ data: APICustomer[] }> {
  try {
    // Try API first if online
    if (syncService.getOnlineStatus()) {
      const response = await customersApi.getCustomers();
      
      // Update IndexedDB with fresh data
      await db.customers.clear();
      const dbCustomers: DBCustomer[] = response.data.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email || '',
        phone: c.phone || '',
        address: c.address || '',
        pendingAmount: c.pendingAmount.toString(),
        deniStatus: c.deniStatus || '',
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        _synced: true,
        _deleted: false
      }));
      await db.customers.bulkPut(dbCustomers);
      
      return response;
    }
  } catch (error) {
    console.log('API failed, falling back to IndexedDB:', error);
  }

  // Fallback to IndexedDB
  const customers = await db.customers.filter(c => !c._deleted).toArray();

  const apiCustomers: APICustomer[] = customers.map(c => ({
    id: c.id!,
    name: c.name,
    email: c.email,
    phone: c.phone,
    address: c.address,
    pendingAmount: c.pendingAmount,
    deniStatus: c.deniStatus,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt
  }));

  return { data: apiCustomers };
}

export async function createCustomerOffline(payload: CreateCustomerPayload): Promise<{ data: APICustomer }> {
  // Save to IndexedDB immediately
  const newCustomer: Omit<DBCustomer, 'id'> = {
    name: payload.name.trim(),
    email: payload.email?.trim() || '',
    phone: payload.phone?.trim() || '',
    address: payload.address?.trim() || '',
    pendingAmount: '0',
    deniStatus: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _synced: false,
    _deleted: false
  };

  const id = await db.customers.add(newCustomer);
  const savedCustomer = await db.customers.get(id);

  if (!savedCustomer) {
    throw new Error('Failed to save customer to local database');
  }

  // Queue for sync
  await syncService.addToQueue('customers', 'create', { ...savedCustomer, id });

  // Try to sync immediately if online
  if (syncService.getOnlineStatus()) {
    try {
      await syncService.sync();
      const synced = await db.customers.get(id);
      if (synced) {
        const apiCustomer: APICustomer = {
          id: synced.id!,
          name: synced.name,
          email: synced.email,
          phone: synced.phone,
          address: synced.address,
          pendingAmount: synced.pendingAmount,
          deniStatus: synced.deniStatus,
          createdAt: synced.createdAt,
          updatedAt: synced.updatedAt
        };
        return { data: apiCustomer };
      }
    } catch (error) {
      console.log('Sync failed, customer saved locally:', error);
    }
  }

  const apiCustomer: APICustomer = {
    id: savedCustomer.id!,
    name: savedCustomer.name,
    email: savedCustomer.email,
    phone: savedCustomer.phone,
    address: savedCustomer.address,
    pendingAmount: savedCustomer.pendingAmount,
    deniStatus: savedCustomer.deniStatus,
    createdAt: savedCustomer.createdAt,
    updatedAt: savedCustomer.updatedAt
  };
  return { data: apiCustomer };
}

export async function updateCustomerOffline(
  id: number,
  payload: UpdateCustomerPayload
): Promise<{ data: APICustomer }> {
  const existing = await db.customers.get(id);
  if (!existing) {
    throw new Error('Customer not found');
  }

  const updatedCustomer: DBCustomer = {
    ...existing,
    ...(payload.name !== undefined && { name: payload.name.trim() }),
    ...(payload.email !== undefined && { email: payload.email?.trim() || '' }),
    ...(payload.phone !== undefined && { phone: payload.phone?.trim() || '' }),
    ...(payload.address !== undefined && { address: payload.address?.trim() || '' }),
    updatedAt: new Date().toISOString(),
    _synced: false
  };

  await db.customers.put(updatedCustomer);

  // Queue for sync
  await syncService.addToQueue('customers', 'update', updatedCustomer);

  // Try to sync immediately if online
  if (syncService.getOnlineStatus()) {
    try {
      await syncService.sync();
      const synced = await db.customers.get(id);
      if (synced) {
        const apiCustomer: APICustomer = {
          id: synced.id!,
          name: synced.name,
          email: synced.email,
          phone: synced.phone,
          address: synced.address,
          pendingAmount: synced.pendingAmount,
          deniStatus: synced.deniStatus,
          createdAt: synced.createdAt,
          updatedAt: synced.updatedAt
        };
        return { data: apiCustomer };
      }
    } catch (error) {
      console.log('Sync failed, customer updated locally:', error);
    }
  }

  const apiCustomer: APICustomer = {
    id: updatedCustomer.id!,
    name: updatedCustomer.name,
    email: updatedCustomer.email,
    phone: updatedCustomer.phone,
    address: updatedCustomer.address,
    pendingAmount: updatedCustomer.pendingAmount,
    deniStatus: updatedCustomer.deniStatus,
    createdAt: updatedCustomer.createdAt,
    updatedAt: updatedCustomer.updatedAt
  };
  return { data: apiCustomer };
}

export async function deleteCustomerOffline(id: number): Promise<{ message: string }> {
  const existing = await db.customers.get(id);
  if (!existing) {
    throw new Error('Customer not found');
  }

  // Mark as deleted in IndexedDB
  await db.customers.update(id, { _deleted: true, _synced: false });

  // Queue for sync
  await syncService.addToQueue('customers', 'delete', existing);

  // Try to sync immediately if online
  if (syncService.getOnlineStatus()) {
    try {
      await syncService.sync();
      return { message: 'Customer deleted and synced' };
    } catch (error) {
      console.log('Sync failed, customer marked for deletion:', error);
    }
  }

  return { message: 'Customer marked for deletion (will sync when online)' };
}
