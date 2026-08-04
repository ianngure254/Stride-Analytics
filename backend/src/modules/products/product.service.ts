import { db } from '../../db/client';
import { products, type Product, type NewProduct } from '../../db/schema';
import { eq, and, like, desc, sql } from 'drizzle-orm';

export interface UpdateStockPayload {
  qty:       number;               // delta — positive = add, negative = deduct
  operation: 'add' | 'deduct' | 'set';
}

export interface ProductFilters {
  category?:    string;
  isLowStock?:  boolean;
  isActive?:    boolean;
  search?:      string;
}

export const getAllProducts = async (
  filters: ProductFilters = {}
) => {
  const conditions = [eq(products.isActive, filters.isActive ?? true)];
  
  if (filters.category) {
    conditions.push(eq(products.category, filters.category));
  }
  
  if (filters.search) {
    conditions.push(like(products.name, `%${filters.search}%`));
  }
  
  if (filters.isLowStock) {
    conditions.push(sql`${products.stock} <= 10`); // Using hardcoded reorder level
  }

  const result = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(products.name);

  return result;
};

export const getProductById = async (id: string) => {
  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, parseInt(id)))
    .limit(1);
    
  if (!result.length) {
    throw new Error('Product not found');
  }
  return result[0];
};

export const getLowStockProducts = async () => {
  return await db
    .select()
    .from(products)
    .where(and(
      eq(products.isActive, true),
      sql`${products.stock} <= 10`
    ))
    .orderBy(products.name);
};

export const createProduct = async (
  data: Omit<NewProduct, 'id' | 'createdAt' | 'updatedAt'>
) => {
  const result = await db
    .insert(products)
    .values(data)
    .returning();
    
  return result[0];
};

export const updateProduct = async (
  id: string,
  data: Partial<NewProduct>
) => {
  const result = await db
    .update(products)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(products.id, parseInt(id)))
    .returning();
    
  if (!result.length) {
    throw new Error('Product not found');
  }
  return result[0];
};

export const updateStock = async (
  id: string,
  payload: UpdateStockPayload
) => {
  const currentProduct = await getProductById(id);
  const currentStock = Number(currentProduct.stock);
  
  let newStock: number;
  switch (payload.operation) {
    case 'add':    newStock = currentStock + payload.qty; break;
    case 'deduct': newStock = currentStock - payload.qty; break;
    case 'set':    newStock = payload.qty;           break;
    default:        throw new Error('Invalid operation');
  }
  
  if (newStock < 0) {
    throw new Error(`Insufficient stock for "${currentProduct.name}"`);
  }

  const result = await db
    .update(products)
    .set({ stock: newStock.toString(), updatedAt: new Date() })
    .where(eq(products.id, parseInt(id)))
    .returning();
    
  return result[0];
};

export const deactivateProduct = async (id: string) => {
  const result = await db
    .update(products)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(products.id, parseInt(id)))
    .returning();
    
  if (!result.length) {
    throw new Error('Product not found');
  }
  return result[0];
};

export const getCategories = async (): Promise<string[]> => {
  const result = await db
    .selectDistinct({ category: products.category })
    .from(products)
    .where(and(
      eq(products.isActive, true),
      sql`${products.category} IS NOT NULL`
    ));
    
  return result.map(row => row.category).filter((cat): cat is string => Boolean(cat));
};