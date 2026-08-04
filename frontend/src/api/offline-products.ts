import { db, type Product as DBProduct } from '../lib/db';
import { syncService } from '../lib/sync';
import * as productsApi from './products';
import type { CreateProductPayload, UpdateProductPayload, UpdateStockPayload, Product as APIProduct } from './products';

// Validation helpers
const validateProductData = (data: CreateProductPayload): { valid: boolean; error?: string } => {
  if (!data.name || data.name.trim().length === 0) {
    return { valid: false, error: 'Product name is required' };
  }
  if (data.price === undefined || data.price === null || data.price < 0) {
    return { valid: false, error: 'Price must be a positive number' };
  }
  if (data.stock !== undefined && data.stock < 0) {
    return { valid: false, error: 'Stock cannot be negative' };
  }
  return { valid: true };
};

// Offline-aware product operations
// Tries API first, falls back to IndexedDB if offline or API fails

export async function getProductsOffline(filters?: {
  category?: string;
  lowStock?: boolean;
  search?: string;
}): Promise<{ data: APIProduct[]; count: number }> {
  try {
    // Try API first if online
    if (syncService.getOnlineStatus()) {
      const response = await productsApi.getProducts(filters);
      
      // Update IndexedDB with fresh data
      await db.products.clear();
      const dbProducts: DBProduct[] = response.data.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        price: p.price.toString(),
        stock: p.stock.toString(),
        unit: p.unit || 'pcs',
        reorderLevel: '10',
        category: p.category || '',
        isActive: p.isActive,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        _synced: true,
        _deleted: false
      }));
      await db.products.bulkPut(dbProducts);
      
      return response;
    }
  } catch (error) {
    console.log('API failed, falling back to IndexedDB:', error);
  }

  // Fallback to IndexedDB
  let products = await db.products.filter(p => !p._deleted).toArray();

  // Apply filters
  if (filters?.category) {
    products = products.filter(p => p.category === filters.category);
  }
  
  if (filters?.lowStock) {
    products = products.filter(p => parseFloat(p.stock) <= 10);
  }
  
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      p.category?.toLowerCase().includes(searchLower)
    );
  }

  const apiProducts: APIProduct[] = products.map(p => ({
    id: p.id!,
    name: p.name,
    description: p.description || null,
    price: p.price,
    stock: parseFloat(p.stock),
    unit: p.unit || 'pcs',
    category: p.category || null,
    isActive: p.isActive,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  }));

  return {
    data: apiProducts,
    count: products.length
  };
}

export async function getProductOffline(id: string | number): Promise<{ data: APIProduct }> {
  try {
    // Try API first if online
    if (syncService.getOnlineStatus()) {
      const response = await productsApi.getProduct(id);
      
      // Update IndexedDB
      const dbProduct: DBProduct = {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description || '',
        price: response.data.price.toString(),
        stock: response.data.stock.toString(),
        unit: response.data.unit || 'pcs',
        reorderLevel: '10',
        category: response.data.category || '',
        isActive: response.data.isActive,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
        _synced: true,
        _deleted: false
      };
      await db.products.put(dbProduct);

      // Ensure unit is in response
      const apiResponse = {
        data: {
          ...response.data,
          unit: response.data.unit || 'pcs'
        }
      };

      return apiResponse;
    }
  } catch (error) {
    console.log('API failed, falling back to IndexedDB:', error);
  }

  // Fallback to IndexedDB
  const product = await db.products.get(Number(id));
  if (!product) {
    throw new Error('Product not found');
  }

  const apiProduct: APIProduct = {
    id: product.id!,
    name: product.name,
    description: product.description || null,
    price: product.price,
    stock: parseFloat(product.stock),
    unit: product.unit || 'pcs',
    category: product.category || null,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };

  return { data: apiProduct };
}

export async function createProductOffline(payload: CreateProductPayload): Promise<{ message: string; data?: APIProduct }> {
  // Validate input data
  const validation = validateProductData(payload);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    // Save to IndexedDB immediately
    const newProduct: Omit<DBProduct, 'id'> = {
      name: payload.name.trim(),
      description: payload.description?.trim() || '',
      price: payload.price.toString(),
      stock: (payload.stock || 0).toString(),
      unit: payload.unit || 'pcs',
      reorderLevel: '10',
      category: payload.category?.trim() || '',
      isActive: payload.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _synced: false,
      _deleted: false
    };

    const id = await db.products.add(newProduct);
    const savedProduct = await db.products.get(id);

    if (!savedProduct) {
      throw new Error('Failed to save product to local database');
    }

    // Queue for sync
    await syncService.addToQueue('products', 'create', { ...savedProduct, id });

    // Try to sync immediately if online
    if (syncService.getOnlineStatus()) {
      try {
        await syncService.sync();
        // Fetch the synced product with server ID
        const synced = await db.products.get(id);
        if (synced) {
          const apiProduct: APIProduct = {
            id: synced.id!,
            name: synced.name,
            description: synced.description || null,
            price: synced.price,
            stock: parseFloat(synced.stock),
            unit: synced.unit || 'pcs',
            category: synced.category || null,
            isActive: synced.isActive,
            createdAt: synced.createdAt,
            updatedAt: synced.updatedAt
          };
          return { message: 'Product created and synced', data: apiProduct };
        }
      } catch (error) {
        console.log('Sync failed, product saved locally:', error);
      }
    }

    const apiProduct: APIProduct = {
      id: savedProduct.id!,
      name: savedProduct.name,
      description: savedProduct.description || null,
      price: savedProduct.price,
      stock: parseFloat(savedProduct.stock),
      unit: savedProduct.unit || 'pcs',
      category: savedProduct.category || null,
      isActive: savedProduct.isActive,
      createdAt: savedProduct.createdAt,
      updatedAt: savedProduct.updatedAt
    };
    return { message: 'Product created locally (will sync when online)', data: apiProduct };
  } catch (error) {
    console.error('Failed to create product offline:', error);
    throw error;
  }
}

export async function updateProductOffline(
  id: string | number,
  payload: UpdateProductPayload
): Promise<{ message: string; data?: APIProduct }> {
  const numId = Number(id);

  // Validate input data if provided
  if (payload.name !== undefined && payload.name.trim().length === 0) {
    throw new Error('Product name cannot be empty');
  }
  if (payload.price !== undefined && payload.price < 0) {
    throw new Error('Price cannot be negative');
  }
  if (payload.stock !== undefined && payload.stock < 0) {
    throw new Error('Stock cannot be negative');
  }

  try {
    // Update in IndexedDB immediately
    const existing = await db.products.get(numId);
    if (!existing) {
      throw new Error('Product not found');
    }

    const updatedProduct: DBProduct = {
      ...existing,
      ...(payload.name !== undefined && { name: payload.name.trim() }),
      ...(payload.description !== undefined && { description: payload.description?.trim() || '' }),
      ...(payload.price !== undefined && { price: payload.price.toString() }),
      ...(payload.stock !== undefined && { stock: payload.stock.toString() }),
      ...(payload.unit !== undefined && { unit: payload.unit }),
      ...(payload.category !== undefined && { category: payload.category?.trim() || '' }),
      ...(payload.isActive !== undefined && { isActive: payload.isActive }),
      updatedAt: new Date().toISOString(),
      _synced: false
    };

    await db.products.put(updatedProduct);

    // Queue for sync
    await syncService.addToQueue('products', 'update', updatedProduct);

    // Try to sync immediately if online
    if (syncService.getOnlineStatus()) {
      try {
        await syncService.sync();
        const synced = await db.products.get(numId);
        if (synced) {
          const apiProduct: APIProduct = {
            id: synced.id!,
            name: synced.name,
            description: synced.description || null,
            price: synced.price,
            stock: parseFloat(synced.stock),
            unit: synced.unit || 'pcs',
            category: synced.category || null,
            isActive: synced.isActive,
            createdAt: synced.createdAt,
            updatedAt: synced.updatedAt
          };
          return { message: 'Product updated and synced', data: apiProduct };
        }
      } catch (error) {
        console.log('Sync failed, product updated locally:', error);
      }
    }

    const apiProduct: APIProduct = {
      id: updatedProduct.id!,
      name: updatedProduct.name,
      description: updatedProduct.description || null,
      price: updatedProduct.price,
      stock: parseFloat(updatedProduct.stock),
      unit: updatedProduct.unit || 'pcs',
      category: updatedProduct.category || null,
      isActive: updatedProduct.isActive,
      createdAt: updatedProduct.createdAt,
      updatedAt: updatedProduct.updatedAt
    };
    return {
      message: 'Product updated locally (will sync when online)',
      data: apiProduct
    };
  } catch (error) {
    console.error('Failed to update product offline:', error);
    throw error;
  }
}

export async function updateStockOffline(
  id: string | number,
  payload: UpdateStockPayload
): Promise<{ message: string; data?: APIProduct }> {
  const numId = Number(id);

  const existing = await db.products.get(numId);
  if (!existing) {
    throw new Error('Product not found');
  }

  let newStock = parseFloat(existing.stock);
  switch (payload.operation) {
    case 'add':
      newStock += payload.qty;
      break;
    case 'deduct':
      newStock = Math.max(0, newStock - payload.qty);
      break;
    case 'set':
      newStock = payload.qty;
      break;
  }

  const updatedProduct: DBProduct = {
    ...existing,
    stock: newStock.toString(),
    updatedAt: new Date().toISOString(),
    _synced: false
  };

  await db.products.put(updatedProduct);

  // Queue for sync
  await syncService.addToQueue('products', 'update', updatedProduct);

  // Try to sync immediately if online
  if (syncService.getOnlineStatus()) {
    try {
      await syncService.sync();
      const synced = await db.products.get(numId);
      if (synced) {
        const apiProduct: APIProduct = {
          id: synced.id!,
          name: synced.name,
          description: synced.description || null,
          price: synced.price,
          stock: parseFloat(synced.stock),
          unit: synced.unit || 'pcs',
          category: synced.category || null,
          isActive: synced.isActive,
          createdAt: synced.createdAt,
          updatedAt: synced.updatedAt
        };
        return { message: 'Stock updated and synced', data: apiProduct };
      }
    } catch (error) {
      console.log('Sync failed, stock updated locally:', error);
    }
  }

  const apiProduct: APIProduct = {
    id: updatedProduct.id!,
    name: updatedProduct.name,
    description: updatedProduct.description || null,
    price: updatedProduct.price,
    stock: parseFloat(updatedProduct.stock),
    unit: updatedProduct.unit || 'pcs',
    category: updatedProduct.category || null,
    isActive: updatedProduct.isActive,
    createdAt: updatedProduct.createdAt,
    updatedAt: updatedProduct.updatedAt
  };
  return {
    message: 'Stock updated locally (will sync when online)',
    data: apiProduct
  };
}

export async function deleteProductOffline(id: string | number): Promise<{ message: string }> {
  const numId = Number(id);

  const existing = await db.products.get(numId);
  if (!existing) {
    throw new Error('Product not found');
  }

  // Mark as deleted in IndexedDB
  await db.products.update(numId, { _deleted: true, _synced: false });

  // Queue for sync
  await syncService.addToQueue('products', 'delete', existing);

  // Try to sync immediately if online
  if (syncService.getOnlineStatus()) {
    try {
      await syncService.sync();
      return { message: 'Product deleted and synced' };
    } catch (error) {
      console.log('Sync failed, product marked for deletion:', error);
    }
  }

  return { message: 'Product marked for deletion (will sync when online)' };
}

export async function getLowStockProductsOffline(): Promise<{ data: APIProduct[]; count: number }> {
  try {
    if (syncService.getOnlineStatus()) {
      return await productsApi.getLowStockProducts();
    }
  } catch (error) {
    console.log('API failed, falling back to IndexedDB:', error);
  }

  const products = await db.products
    .filter(p => !p._deleted && parseFloat(p.stock) <= 10)
    .toArray();

  const apiProducts: APIProduct[] = products.map(p => ({
    id: p.id!,
    name: p.name,
    description: p.description || null,
    price: p.price,
    stock: parseFloat(p.stock),
    unit: p.unit || 'pcs',
    category: p.category || null,
    isActive: p.isActive,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  }));

  return {
    data: apiProducts,
    count: products.length
  };
}

export async function getCategoriesOffline(): Promise<{ data: string[] }> {
  try {
    if (syncService.getOnlineStatus()) {
      return await productsApi.getCategories();
    }
  } catch (error) {
    console.log('API failed, falling back to IndexedDB:', error);
  }

  const products = await db.products.filter(p => !p._deleted).toArray();
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  return { data: categories };
}
