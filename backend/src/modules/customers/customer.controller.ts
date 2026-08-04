import { Request, Response, NextFunction } from 'express';
import * as customerService from './customer.service';

// GET /customers
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, isActive } = req.query;
    const customers = await customerService.getAllCustomers({
      search: search as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
    res.json({ data: customers, count: customers.length });
  } catch (err) {
    next(err);
  }
};

// GET /customers/:id
export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await customerService.getCustomerById(Number(req.params.id));
    res.json({ data: customer });
  } catch (err) {
    next(err);
  }
};

// GET /customers/:id/stats
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await customerService.getCustomerStats(Number(req.params.id));
    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
};

// POST /customers
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json({ data: customer, message: 'Customer created successfully' });
  } catch (err) {
    next(err);
  }
};

// PUT /customers/:id
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await customerService.updateCustomer(Number(req.params.id), req.body);
    res.json({ data: customer, message: 'Customer updated successfully' });
  } catch (err) {
    next(err);
  }
};

// DELETE /customers/:id
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await customerService.deleteCustomer(Number(req.params.id));
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// PATCH /customers/:id/clear
export const clearOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await customerService.clearCustomer(Number(req.params.id));
    res.json({ data: customer, message: 'Customer marked as cleared' });
  } catch (err) {
    next(err);
  }
};
