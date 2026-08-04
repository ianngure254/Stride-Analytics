import { Request, Response, NextFunction } from 'express';
import * as paymentService from './payment.service';

// GET /payments
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { saleId, paymentMethod, status, startDate, endDate } = req.query;
    const payments = await paymentService.getAllPayments({
      saleId: saleId ? Number(saleId) : undefined,
      paymentMethod: paymentMethod as string,
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    res.json({ data: payments, count: payments.length });
  } catch (err) {
    next(err);
  }
};

// GET /payments/:id
export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await paymentService.getPaymentById(Number(req.params.id));
    res.json({ data: payment });
  } catch (err) {
    next(err);
  }
};

// GET /payments/stats
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { saleId, status } = req.query;
    const stats = await paymentService.getPaymentStats({
      saleId: saleId ? Number(saleId) : undefined,
      status: status as string,
    });
    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
};

// GET /sales/:saleId/payments
export const getSalePayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await paymentService.getSalePaymentSummary(Number(req.params.saleId));
    res.json({ data: summary });
  } catch (err) {
    next(err);
  }
};

// POST /payments
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await paymentService.createPayment(req.body);
    res.status(201).json({ data: payment, message: 'Payment created successfully' });
  } catch (err) {
    next(err);
  }
};

// PUT /payments/:id/status
export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const payment = await paymentService.updatePaymentStatus(Number(req.params.id), status);
    res.json({ data: payment, message: 'Payment status updated successfully' });
  } catch (err) {
    next(err);
  }
};
