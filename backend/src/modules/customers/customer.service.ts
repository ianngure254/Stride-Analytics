import { db } from '../../db/client';
import { customers, type Customer, type NewCustomer } from '../../db/schema';
import { eq, like, and } from 'drizzle-orm';

export interface CustomerFilters {
  search?: string;
  isActive?: boolean;
}

// ─── Read Operations -

export const getAllCustomers = async (filters: CustomerFilters = {}) => {
  const conditions = [];
  
  if (filters.search) {
    conditions.push(like(customers.name, `%${filters.search}%`));
  }
  
  // Note: customers table doesn't have isActive field, so we skip that filter for now
  
  const query = db.select().from(customers);
  
  if (conditions.length > 0) {
    return await query.where(and(...conditions)).orderBy(customers.name);
  }
  
  return await query.orderBy(customers.name);
};

export const getCustomerById = async (id: number): Promise<Customer> => {
  const customer = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!customer.length) {
    throw new Error('Customer not found');
  }
  return customer[0];
};

export const getCustomerByEmail = async (email: string): Promise<Customer | null> => {
  const customer = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
  return customer.length ? customer[0] : null;
};

// ─── Create Operations ───────────────────────────────────────────────────────

export const createCustomer = async (data: NewCustomer & { pendingAmount?: number | string | null }): Promise<Customer> => {
  if (data.email) {
    const existing = await getCustomerByEmail(data.email);
    if (existing) {
      throw new Error('Customer with this email already exists');
    }
  }

  const insertData: NewCustomer = {
    ...data,
    pendingAmount: data.pendingAmount != null ? String(data.pendingAmount) : '0',
    deniStatus: data.deniStatus ?? 'pending',
  };

  const result = await db.insert(customers).values(insertData).returning();
  return result[0];
};

// ─── Update Operations ────

export const updateCustomer = async (id: number, data: Partial<NewCustomer>): Promise<Customer> => {
  // Check if email already exists for another customer
  if (data.email) {
    const existing = await getCustomerByEmail(data.email);
    if (existing && existing.id !== id) {
      throw new Error('Customer with this email already exists');
    }
  }
  
  const result = await db
    .update(customers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(customers.id, id))
    .returning();
    
  if (!result.length) {
    throw new Error('Customer not found');
  }
  
  return result[0];
};

// ─── Delete Operations ───────────────────────────────────────────────────────

export const deleteCustomer = async (id: number): Promise<void> => {
  await getCustomerById(id); // throws 'Customer not found' if missing
  await db.delete(customers).where(eq(customers.id, id));
};

// ─── Clear Operations ────────────────────────────────────────────────────────

export const clearCustomer = async (id: number): Promise<Customer> => {
  const result = await db
    .update(customers)
    .set({ pendingAmount: '0', deniStatus: 'cleared', updatedAt: new Date() })
    .where(eq(customers.id, id))
    .returning();

  if (!result.length) {
    throw new Error('Customer not found');
  }

  return result[0];
};

// ─── Additional Business Logic ─────────────────────────────────────────────

export const getCustomerStats = async (customerId: number) => {
  // This would typically include sales data, payment history, etc.
  // For now, return basic customer info
  const customer = await getCustomerById(customerId);
  return {
    customer,
    totalSales: 0, // Would calculate from sales table
    totalPayments: 0, // Would calculate from payments table
    outstandingBalance: 0, // Would calculate from sales - payments
  };
};
