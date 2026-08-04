import Joi from 'joi';

const PRODUCT_UNITS = ['pcs', 'kg', 'tonnes', 'g', 'litres', 'ml', 'rolls', 'bags', 'metres', 'feet', 'pairs', 'boxes', 'sheets'] as const;

export const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(150).required().messages({
    'string.min':  'Product name must be at least 2 characters',
    'any.required': 'Product name is required',
  }),

  description: Joi.string().max(500).optional().allow('', null),

  price: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Price must be greater than 0',
    'any.required':    'Price is required',
  }),

  stock: Joi.number().min(0).default(0),

  unit: Joi.string().valid(...PRODUCT_UNITS).default('pcs'),

  category: Joi.string().max(80).optional().allow('', null),

  isActive: Joi.boolean().default(true),
}).options({ abortEarly: false });

export const updateProductSchema = Joi.object({
  name:            Joi.string().min(2).max(150),
  description:     Joi.string().max(500).allow('', null),
  price:           Joi.number().positive().precision(2),
  stock:           Joi.number().min(0),
  unit:            Joi.string().valid(...PRODUCT_UNITS),
  category:        Joi.string().max(80).allow('', null),
  isActive:        Joi.boolean(),
})
  .min(1)                   
  .options({ abortEarly: false })
  .messages({ 'object.min': 'At least one field is required to update' });

export const updateStockSchema = Joi.object({
  qty: Joi.number()
    .min(0)
    .precision(2)
    .required()
    .messages({
      'any.required':  'Stock quantity is required',
      'number.min':    'Quantity cannot be negative',
    }),

  operation: Joi.string()
    .valid('add', 'deduct', 'set')
    .required()
    .messages({
      'any.only':     'Operation must be: add, deduct, or set',
      'any.required': 'Stock operation is required',
    }),
}).options({ abortEarly: false });

// Manual type definitions based on schema structure
export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  unit?: string;
  category?: string;
  isActive?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  unit?: string;
  category?: string;
  isActive?: boolean;
}

export interface UpdateStockInput {
  qty: number;
  operation: 'add' | 'deduct' | 'set';
}