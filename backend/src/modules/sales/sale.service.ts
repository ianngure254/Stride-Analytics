import { db } from '../../db/client';
import { sales, saleItems, products, customers, type Sale, type NewSale, type NewSaleItem } from '../../db/schema';
import { eq, and, desc, gte, lte, sql, type SQL } from 'drizzle-orm';

export interface CreateSaleData {
  customerId?: number;
  items: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
  }>;
  paymentMethod?: string;
  notes?: string;
}

export interface SaleFilters {
  customerId?: number;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

const formatDecimal = (value: number) => value.toFixed(2);

// ─── Read Operations ─────────────────────────────────────────────────────────

export const getAllSales = async (filters: SaleFilters = {}) => {
  const conditions: SQL<unknown>[] = [];

  if (filters.customerId !== undefined) {
    conditions.push(eq(sales.customerId, filters.customerId));
  }

  if (filters.status) {
    conditions.push(eq(sales.status, filters.status));
  }

  if (filters.startDate) {
    conditions.push(gte(sales.saleDate, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(sales.saleDate, filters.endDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return await db
    .select({
      id: sales.id,
      customerId: sales.customerId,
      totalAmount: sales.totalAmount,
      status: sales.status,
      paymentMethod: sales.paymentMethod,
      saleDate: sales.saleDate,
      notes: sales.notes,
      createdAt: sales.createdAt,
      updatedAt: sales.updatedAt,
      customerName: customers.name,
      customerEmail: customers.email,
    })
    .from(sales)
    .leftJoin(customers, eq(sales.customerId, customers.id))
    .where(whereClause)
    .orderBy(desc(sales.saleDate));
};

export const getSaleById = async (id: number) => {
  const sale = await db
    .select({
      id: sales.id,
      customerId: sales.customerId,
      totalAmount: sales.totalAmount,
      status: sales.status,
      paymentMethod: sales.paymentMethod,
      saleDate: sales.saleDate,
      notes: sales.notes,
      createdAt: sales.createdAt,
      updatedAt: sales.updatedAt,
      customerName: customers.name,
      customerEmail: customers.email,
      customerPhone: customers.phone,
    })
    .from(sales)
    .leftJoin(customers, eq(sales.customerId, customers.id))
    .where(eq(sales.id, id))
    .limit(1);

  if (!sale.length) {
    throw new Error('Sale not found');
  }

  // Get sale items
  const items = await db
    .select({
      id: saleItems.id,
      productId: saleItems.productId,
      quantity: saleItems.quantity,
      unitPrice: saleItems.unitPrice,
      totalPrice: saleItems.totalPrice,
      productName: products.name,
    })
    .from(saleItems)
    .leftJoin(products, eq(saleItems.productId, products.id))
    .where(eq(saleItems.saleId, id));

  return {
    ...sale[0],
    items,
  };
};

// ─── Create Operations ───────────────────────────────────────────────────────

export const createSale = async (data: CreateSaleData): Promise<Sale> => {
  // Calculate total amount
  const totalAmount = data.items.reduce(
    (sum, item) => sum + (item.quantity * item.unitPrice),
    0
  );

  // Create sale
  const salePayload: NewSale = {
    customerId: data.customerId ?? null,
    totalAmount: formatDecimal(totalAmount),
    status: 'pending',
    paymentMethod: data.paymentMethod ?? null,
    notes: data.notes,
  };

  const saleResult = await db
    .insert(sales)
    .values(salePayload)
    .returning();

  const newSale = saleResult[0];

  // Create sale items and deduct product stock
  const saleItemsData: NewSaleItem[] = data.items.map(item => ({
    saleId: newSale.id,
    productId: item.productId,
    quantity: formatDecimal(item.quantity),
    unitPrice: formatDecimal(item.unitPrice),
    totalPrice: formatDecimal(item.quantity * item.unitPrice),
  }));

  await db.insert(saleItems).values(saleItemsData);

  // Deduct stock from products
  for (const item of data.items) {
    await db
      .update(products)
      .set({
        stock: sql`${products.stock} - ${item.quantity}`,
        updatedAt: new Date()
      })
      .where(eq(products.id, item.productId));
  }

  return newSale;
};

// ─── Update Operations ───────────────────────────────────────────────────────

export const updateSaleStatus = async (id: number, status: string): Promise<Sale> => {
  const result = await db
    .update(sales)
    .set({ status, updatedAt: new Date() })
    .where(eq(sales.id, id))
    .returning();

  if (!result.length) {
    throw new Error('Sale not found');
  }

  return result[0];
};

// ─── Business Logic ─────────────────────────────────────────────────────────

export const getSalesStats = async (filters: SaleFilters = {}) => {
  const conditions: SQL<unknown>[] = [];

  if (filters.customerId !== undefined) {
    conditions.push(eq(sales.customerId, filters.customerId));
  }

  if (filters.status) {
    conditions.push(eq(sales.status, filters.status));
  }

  if (filters.startDate) {
    conditions.push(gte(sales.saleDate, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(sales.saleDate, filters.endDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const result = await db.select().from(sales).where(whereClause);
  
  return {
    totalSales: result.reduce((sum, sale) => sum + Number(sale.totalAmount), 0),
    totalSalesCount: result.length,
  };
};

export const getCustomerSalesHistory = async (customerId: number) => {
  return await db
    .select({
      id: sales.id,
      totalAmount: sales.totalAmount,
      status: sales.status,
      saleDate: sales.saleDate,
      notes: sales.notes,
    })
    .from(sales)
    .where(eq(sales.customerId, customerId))
    .orderBy(desc(sales.saleDate));
};
