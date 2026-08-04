import { Request, Response, NextFunction } from 'express';
import * as creditService from './credit.service';

// GET /credits
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId, type, status, startDate, endDate } = req.query;
    const credits = await creditService.getAllCredits({
      customerId: customerId ? Number(customerId) : undefined,
      type: type as string,
      status: status as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    res.json({ data: credits, count: credits.length });
  } catch (err) {
    next(err);
  }
};

// GET /credits/:id
export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credit = await creditService.getCreditById(Number(req.params.id));
    res.json({ data: credit });
  } catch (err) {
    next(err);
  }
};

// GET /credits/stats
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId, status } = req.query;
    const stats = await creditService.getCreditStats({
      customerId: customerId ? Number(customerId) : undefined,
      status: status as string,
    });
    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
};

// GET /customers/:customerId/credits
export const getCustomerCredits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await creditService.getCustomerCreditSummary(Number(req.params.customerId));
    res.json({ data: summary });
  } catch (err) {
    next(err);
  }
};

// GET /credits/:id/usage
export const getUsageHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await creditService.getCreditUsageHistory(Number(req.params.id));
    res.json({ data: history, count: history.length });
  } catch (err) {
    next(err);
  }
};

// POST /credits
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credit = await creditService.createCredit(req.body);
    res.status(201).json({ data: credit, message: 'Credit created successfully' });
  } catch (err) {
    next(err);
  }
};

// PUT /credits/:id/status
export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const credit = await creditService.updateCreditStatus(Number(req.params.id), status);
    res.json({ data: credit, message: 'Credit status updated successfully' });
  } catch (err) {
    next(err);
  }
};

// POST /credits/:id/use
export const useCredit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { saleId, amountUsed } = req.body;
    await creditService.useCredit(Number(req.params.id), saleId, amountUsed);
    res.json({ message: 'Credit used successfully' });
  } catch (err) {
    next(err);
  }
};
