import { db } from '../../db/client';
import { products, customers, sales, saleItems, payments, credits } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';

export class SyncService {
  async getTableData(tableName: string, lastSync?: string) {
    const query = lastSync 
      ? `updatedAt > ${lastSync}`
      : undefined;

    switch (tableName) {
      case 'products':
        return await db.select().from(products).orderBy(desc(products.updatedAt));
      case 'customers':
        return await db.select().from(customers).orderBy(desc(customers.updatedAt));
      case 'sales':
        return await db.select().from(sales).orderBy(desc(sales.updatedAt));
      case 'saleItems':
        return await db.select().from(saleItems).orderBy(desc(saleItems.createdAt));
      case 'payments':
        return await db.select().from(payments).orderBy(desc(payments.updatedAt));
      case 'credits':
        return await db.select().from(credits).orderBy(desc(credits.updatedAt));
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }
  }

  async createRecord(tableName: string, data: any) {
    switch (tableName) {
      case 'products':
        const [product] = await db.insert(products).values(data).returning();
        return product;
      case 'customers':
        const [customer] = await db.insert(customers).values(data).returning();
        return customer;
      case 'sales':
        const [sale] = await db.insert(sales).values(data).returning();
        return sale;
      case 'saleItems':
        const [saleItem] = await db.insert(saleItems).values(data).returning();
        return saleItem;
      case 'payments':
        const [payment] = await db.insert(payments).values(data).returning();
        return payment;
      case 'credits':
        const [credit] = await db.insert(credits).values(data).returning();
        return credit;
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }
  }

  async updateRecord(tableName: string, id: number, data: any) {
    switch (tableName) {
      case 'products':
        const [product] = await db.update(products)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(products.id, id))
          .returning();
        return product;
      case 'customers':
        const [customer] = await db.update(customers)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(customers.id, id))
          .returning();
        return customer;
      case 'sales':
        const [sale] = await db.update(sales)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(sales.id, id))
          .returning();
        return sale;
      case 'saleItems':
        const [saleItem] = await db.update(saleItems)
          .set(data)
          .where(eq(saleItems.id, id))
          .returning();
        return saleItem;
      case 'payments':
        const [payment] = await db.update(payments)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(payments.id, id))
          .returning();
        return payment;
      case 'credits':
        const [credit] = await db.update(credits)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(credits.id, id))
          .returning();
        return credit;
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }
  }

  async deleteRecord(tableName: string, id: number) {
    switch (tableName) {
      case 'products':
        await db.delete(products).where(eq(products.id, id));
        return { success: true };
      case 'customers':
        await db.delete(customers).where(eq(customers.id, id));
        return { success: true };
      case 'sales':
        await db.delete(sales).where(eq(sales.id, id));
        return { success: true };
      case 'saleItems':
        await db.delete(saleItems).where(eq(saleItems.id, id));
        return { success: true };
      case 'payments':
        await db.delete(payments).where(eq(payments.id, id));
        return { success: true };
      case 'credits':
        await db.delete(credits).where(eq(credits.id, id));
        return { success: true };
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }
  }
}

export const syncService = new SyncService();
