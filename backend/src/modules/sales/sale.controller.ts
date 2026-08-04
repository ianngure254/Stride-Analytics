import { Request, Response, NextFunction } from 'express';
import * as saleService from './sale.service';

// GET /sales
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId, status, startDate, endDate } = req.query;
    const sales = await saleService.getAllSales({
      customerId: customerId ? Number(customerId) : undefined,
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    res.json({ data: sales, count: sales.length });
  } catch (err) {
    next(err);
  }
};

// GET /sales/:id
export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sale = await saleService.getSaleById(Number(req.params.id));
    res.json({ data: sale });
  } catch (err) {
    next(err);
  }
};

// GET /sales/stats
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId, status } = req.query;
    const stats = await saleService.getSalesStats({
      customerId: customerId ? Number(customerId) : undefined,
      status: status as string,
    });
    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
};

// GET /customers/:customerId/sales
export const getCustomerHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sales = await saleService.getCustomerSalesHistory(Number(req.params.customerId));
    res.json({ data: sales, count: sales.length });
  } catch (err) {
    next(err);
  }
};

// POST /sales
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sale = await saleService.createSale(req.body);
    res.status(201).json({ data: sale, message: 'Sale created successfully' });
  } catch (err) {
    next(err);
  }
};

// PUT /sales/:id/status
export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const sale = await saleService.updateSaleStatus(Number(req.params.id), status);
    res.json({ data: sale, message: 'Sale status updated successfully' });
  } catch (err) {
    next(err);
  }
};
