import { db } from '../../db/client';
import { payments, type Payment, type NewPayment } from '../../db/schema';
import { and, eq, gte, lte, type SQL } from 'drizzle-orm';

export interface CreatePaymentData {
  saleId: number;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
}

export interface PaymentFilters {
  saleId?: number;
  paymentMethod?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

const formatDecimal = (value: number) => value.toFixed(2);

// ─── Read Operations ─────────────────────────────────────────────────────────

export const getAllPayments = async (filters: PaymentFilters = {}) => {
  const conditions: SQL<unknown>[] = [];

  if (filters.saleId !== undefined) {
    conditions.push(eq(payments.saleId, filters.saleId));
  }

  if (filters.paymentMethod) {
    conditions.push(eq(payments.paymentMethod, filters.paymentMethod));
  }

  if (filters.status) {
    conditions.push(eq(payments.status, filters.status));
  }

  if (filters.startDate) {
    conditions.push(gte(payments.paymentDate, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(payments.paymentDate, filters.endDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return await db
    .select({
      id: payments.id,
      saleId: payments.saleId,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      status: payments.status,
      paymentDate: payments.paymentDate,
      transactionId: payments.transactionId,
      notes: payments.notes,
      createdAt: payments.createdAt,
      updatedAt: payments.updatedAt,
    })
    .from(payments)
    .where(whereClause)
    .orderBy(payments.paymentDate);
};

export const getPaymentById = async (id: number): Promise<Payment> => {
  const payment = await db
    .select()
    .from(payments)
    .where(eq(payments.id, id))
    .limit(1);

  if (!payment.length) {
    throw new Error('Payment not found');
  }

  return payment[0];
};

export const getPaymentsBySaleId = async (saleId: number) => {
  return await db
    .select()
    .from(payments)
    .where(eq(payments.saleId, saleId))
    .orderBy(payments.paymentDate);
};

// ─── Create Operations ───────────────────────────────────────────────────────

export const createPayment = async (data: CreatePaymentData): Promise<Payment> => {
  const payload: NewPayment = {
    saleId: data.saleId,
    amount: formatDecimal(data.amount),
    paymentMethod: data.paymentMethod,
    transactionId: data.transactionId,
    notes: data.notes,
    status: 'pending',
  };

  const result = await db
    .insert(payments)
    .values(payload)
    .returning();

  return result[0];
};

// ─── Update Operations ───────────────────────────────────────────────────────

export const updatePaymentStatus = async (id: number, status: string): Promise<Payment> => {
  const result = await db
    .update(payments)
    .set({ status, updatedAt: new Date() })
    .where(eq(payments.id, id))
    .returning();

  if (!result.length) {
    throw new Error('Payment not found');
  }

  return result[0];
};

// ─── Business Logic ─────────────────────────────────────────────────────────

export const getPaymentStats = async (filters: PaymentFilters = {}) => {
  const conditions: SQL<unknown>[] = [];

  if (filters.saleId !== undefined) {
    conditions.push(eq(payments.saleId, filters.saleId));
  }

  if (filters.status) {
    conditions.push(eq(payments.status, filters.status));
  }

  if (filters.startDate) {
    conditions.push(gte(payments.paymentDate, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(payments.paymentDate, filters.endDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const paymentRows = await db.select().from(payments).where(whereClause);

  return {
    totalAmount: paymentRows.reduce((sum: number, payment) => sum + Number(payment.amount), 0),
    completedPayments: paymentRows.filter(payment => payment.status === 'completed').length,
    pendingPayments: paymentRows.filter(payment => payment.status === 'pending').length,
    failedPayments: paymentRows.filter(payment => payment.status === 'failed').length,
  };
};

export const getSalePaymentSummary = async (saleId: number) => {
  const paymentRows = await getPaymentsBySaleId(saleId);
  
  const totalPaid = paymentRows.reduce((sum: number, payment) => sum + Number(payment.amount), 0);
  const completedPayments = paymentRows.filter(payment => payment.status === 'completed');
  const totalCompleted = completedPayments.reduce((sum: number, payment) => sum + Number(payment.amount), 0);

  return {
    saleId,
    totalPaid,
    totalCompleted,
    pendingAmount: totalPaid - totalCompleted,
    paymentCount: paymentRows.length,
    completedCount: completedPayments.length,
    payments: paymentRows,
  };
};
