import { Request, Response, NextFunction } from 'express';
import type { NewProduct } from '../../db/schema';
import * as productService from './product.service';
import type { CreateProductInput, UpdateProductInput, UpdateStockInput } from './product.validation';

type ProductParams = {
  id: string;
};

type ProductQuery = {
  category?: string | string[];
  lowStock?: string | string[];
  search?: string | string[];
};

const getSingleQueryValue = (value?: string | string[]) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

const toCreateProductPayload = (
  data: CreateProductInput
): Omit<NewProduct, 'id' | 'createdAt' | 'updatedAt'> => ({
  name: data.name,
  description: data.description,
  price: data.price.toFixed(2),
  stock: data.stock !== undefined ? data.stock.toFixed(3) : '0',
  unit: data.unit || 'pcs',
  category: data.category,
  isActive: data.isActive ?? true,
});

const toUpdateProductPayload = (data: UpdateProductInput): Partial<NewProduct> => {
  const payload: Partial<NewProduct> = {
    name: data.name,
    description: data.description,
    stock: data.stock !== undefined ? data.stock.toFixed(3) : undefined,
    unit: data.unit,
    category: data.category,
    isActive: data.isActive,
  };

  if (data.price !== undefined) {
    payload.price = data.price.toFixed(2);
  }

  return payload;
};

export const getAll = async (
  req: Request<{}, {}, {}, ProductQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, lowStock, search } = req.query;
    const products = await productService.getAllProducts({
      category: getSingleQueryValue(category),
      search: getSingleQueryValue(search),
      isLowStock: getSingleQueryValue(lowStock) === 'true',
    });

    res.json({ data: products, count: products.length });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (
  req: Request<ProductParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
};

export const getLowStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await productService.getLowStockProducts();
    res.json({ data: products, count: products.length });
  } catch (err) {
    next(err);
  }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await productService.getCategories();
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
};

export const create = async (
  req: Request<{}, {}, CreateProductInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await productService.createProduct(toCreateProductPayload(req.body));
    res.status(201).json({ data: product, message: 'Product created successfully' });
  } catch (err) {
    next(err);
  }
};

export const update = async (
  req: Request<ProductParams, {}, UpdateProductInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await productService.updateProduct(
      req.params.id,
      toUpdateProductPayload(req.body)
    );

    res.json({ data: product, message: 'Product updated successfully' });
  } catch (err) {
    next(err);
  }
};

export const updateStock = async (
  req: Request<ProductParams, {}, UpdateStockInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await productService.updateStock(req.params.id, req.body);

    res.json({
      data: product,
      message: `Stock updated. Current qty: ${product.stock}`,
    });
  } catch (err) {
    next(err);
  }
};

export const remove = async (
  req: Request<ProductParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    await productService.deactivateProduct(req.params.id);
    res.json({ message: 'Product deactivated successfully' });
  } catch (err) {
    next(err);
  }
};
