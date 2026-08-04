// Product model interfaces and types for Drizzle ORM
import { Product, NewProduct } from '../../db/schema';

// Re-export types from schema for convenience
export type { Product, NewProduct };

// Additional interfaces for business logic
export interface ProductFilters {
  category?: string;
  isLowStock?: boolean;
  isActive?: boolean;
  search?: string;
}

export interface UpdateStockPayload {
  qty: number;               // delta — positive = add, negative = deduct
  operation: 'add' | 'deduct' | 'set';
}

// Business logic interfaces
export interface ProductWithStats extends Product {
  totalSales?: number;
  totalRevenue?: number;
  lowStockAlert?: boolean;
}

// Validation interfaces
export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  category?: string;
  isActive?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  isActive?: boolean;
}

export interface UpdateStockRequest {
  qty: number;
  operation: 'add' | 'deduct' | 'set';
}

// Helper functions for product business logic
export const isLowStock = (product: Product, threshold: number = 10): boolean => {
  return Number(product.stock) <= threshold;
};

export const calculateStockValue = (product: Product): number => {
  return Number(product.price) * Number(product.stock);
};

export const formatProductPrice = (price: string, currency: string = 'KES'): string => {
  return `${currency} ${Number(price).toFixed(2)}`;
};
