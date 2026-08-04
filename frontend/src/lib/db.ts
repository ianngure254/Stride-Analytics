import Dexie, { type Table } from 'dexie';

// Database interfaces matching backend schema
export interface Product {
  id?: number;
  name: string;
  description?: string;
  price: string;
  stock: string;
  unit: string;
  reorderLevel: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _synced?: boolean;
  _deleted?: boolean;
}

export interface Customer {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  pendingAmount: string;
  deniStatus: string;
  createdAt: string;
  updatedAt: string;
  _synced?: boolean;
  _deleted?: boolean;
}

export interface Sale {
  id?: number;
  customerId?: number;
  totalAmount: string;
  status: string;
  paymentMethod?: string;
  saleDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _synced?: boolean;
  _deleted?: boolean;
}

export interface SaleItem {
  id?: number;
  saleId?: number;
  productId?: number;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalPrice: string;
  createdAt: string;
  _synced?: boolean;
  _deleted?: boolean;
}

export interface Payment {
  id?: number;
  saleId?: number;
  amount: string;
  paymentMethod: string;
  status: string;
  paymentDate: string;
  transactionId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _synced?: boolean;
  _deleted?: boolean;
}

export interface Credit {
  id?: number;
  customerId?: number;
  amount: string;
  type: string;
  reason?: string;
  status: string;
  balance: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
  _synced?: boolean;
  _deleted?: boolean;
}

export interface SyncQueue {
  id?: number;
  tableName: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retryCount: number;
}

export class POSDatabase extends Dexie {
  products!: Table<Product>;
  customers!: Table<Customer>;
  sales!: Table<Sale>;
  saleItems!: Table<SaleItem>;
  payments!: Table<Payment>;
  credits!: Table<Credit>;
  syncQueue!: Table<SyncQueue>;

  constructor() {
    super('StridePOSDB');
    
    // Version 2: Updated schema with auto-incrementing IDs
    this.version(2).stores({
      products: '++id, name, category, unit, isActive, _synced, _deleted',
      customers: '++id, name, email, phone, _synced, _deleted',
      sales: '++id, customerId, status, paymentMethod, saleDate, _synced, _deleted',
      saleItems: '++id, saleId, productId, _synced, _deleted',
      payments: '++id, saleId, status, paymentMethod, paymentDate, _synced, _deleted',
      credits: '++id, customerId, status, type, _synced, _deleted',
      syncQueue: '++id, tableName, operation, timestamp'
    }).upgrade(() => {
      // Migration from v1 to v2: ensure all records have proper IDs
      console.log('Migrating database from v1 to v2');
    });

    // Version 1: Original schema (for backward compatibility)
    this.version(1).stores({
      products: 'id, name, category, unit, isActive, _synced, _deleted',
      customers: 'id, name, email, phone, _synced, _deleted',
      sales: 'id, customerId, status, paymentMethod, saleDate, _synced, _deleted',
      saleItems: 'id, saleId, productId, _synced, _deleted',
      payments: 'id, saleId, status, paymentMethod, paymentDate, _synced, _deleted',
      credits: 'id, customerId, status, type, _synced, _deleted',
      syncQueue: '++id, tableName, operation, timestamp'
    });
  }
}

export const db = new POSDatabase();
