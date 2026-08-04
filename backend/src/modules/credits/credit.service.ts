import { db } from '../../db/client';
import { credits, creditUsage, customers, type Credit, type NewCredit, type NewCreditUsage } from '../../db/schema';
import { and, eq, gte, lte, type SQL } from 'drizzle-orm';

export interface CreateCreditData {
  customerId: number;
  amount: number;
  type: 'credit' | 'refund' | 'discount';
  reason?: string;
  expiryDate?: Date;
}

export interface CreditFilters {
  customerId?: number;
  type?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

const formatDecimal = (value: number) => value.toFixed(2);

// ─── Read Operations ─────────────────────────────────────────────────────────

export const getAllCredits = async (filters: CreditFilters = {}) => {
  const conditions: SQL<unknown>[] = [];

  if (filters.customerId !== undefined) {
    conditions.push(eq(credits.customerId, filters.customerId));
  }

  if (filters.type) {
    conditions.push(eq(credits.type, filters.type));
  }

  if (filters.status) {
    conditions.push(eq(credits.status, filters.status));
  }

  if (filters.startDate) {
    conditions.push(gte(credits.createdAt, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(credits.createdAt, filters.endDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return await db
    .select({
      id: credits.id,
      customerId: credits.customerId,
      amount: credits.amount,
      type: credits.type,
      reason: credits.reason,
      status: credits.status,
      balance: credits.balance,
      expiryDate: credits.expiryDate,
      createdAt: credits.createdAt,
      updatedAt: credits.updatedAt,
      customerName: customers.name,
      customerEmail: customers.email,
    })
    .from(credits)
    .leftJoin(customers, eq(credits.customerId, customers.id))
    .where(whereClause)
    .orderBy(credits.createdAt);
};

export const getCreditById = async (id: number) => {
  const credit = await db
    .select({
      id: credits.id,
      customerId: credits.customerId,
      amount: credits.amount,
      type: credits.type,
      reason: credits.reason,
      status: credits.status,
      balance: credits.balance,
      expiryDate: credits.expiryDate,
      createdAt: credits.createdAt,
      updatedAt: credits.updatedAt,
      customerName: customers.name,
      customerEmail: customers.email,
    })
    .from(credits)
    .leftJoin(customers, eq(credits.customerId, customers.id))
    .where(eq(credits.id, id))
    .limit(1);

  if (!credit.length) {
    throw new Error('Credit not found');
  }

  return credit[0];
};

export const getCustomerCredits = async (customerId: number) => {
  return await db
    .select()
    .from(credits)
    .where(eq(credits.customerId, customerId))
    .orderBy(credits.createdAt);
};

// ─── Create Operations ───────────────────────────────────────────────────────

export const createCredit = async (data: CreateCreditData): Promise<Credit> => {
  const payload: NewCredit = {
    customerId: data.customerId,
    amount: formatDecimal(data.amount),
    type: data.type,
    reason: data.reason,
    expiryDate: data.expiryDate,
    balance: formatDecimal(data.amount),
    status: 'active',
  };

  const result = await db
    .insert(credits)
    .values(payload)
    .returning();

  return result[0];
};

// ─── Update Operations ─────────────────────────

export const updateCreditStatus = async (id: number, status: string): Promise<Credit> => {
  const result = await db
    .update(credits)
    .set({ status, updatedAt: new Date() })
    .where(eq(credits.id, id))
    .returning();

  if (!result.length) {
    throw new Error('Credit not found');
  }

  return result[0];
};

export const useCredit = async (creditId: number, saleId: number, amountUsed: number): Promise<void> => {
  // Get credit details
  const credit = await db
    .select()
    .from(credits)
    .where(eq(credits.id, creditId))
    .limit(1);

  if (!credit.length) {
    throw new Error('Credit not found');
  }

  const creditData = credit[0];

  if (creditData.status !== 'active') {
    throw new Error('Credit is not active');
  }

  if (Number(creditData.balance) < amountUsed) {
    throw new Error('Insufficient credit balance');
  }

  // Create credit usage record
  const usagePayload: NewCreditUsage = {
    creditId,
    saleId,
    amountUsed: formatDecimal(amountUsed),
  };

  await db.insert(creditUsage).values(usagePayload);

  // Update credit balance
  const newBalance = Number(creditData.balance) - amountUsed;
  const newStatus = newBalance <= 0 ? 'used' : 'active';

  await db
    .update(credits)
    .set({ 
      balance: newBalance.toString(),
      status: newStatus,
      updatedAt: new Date()
    })
    .where(eq(credits.id, creditId));
};

// ─── Business Logic ─────────────────────────────────────────────────────────

export const getCreditStats = async (filters: CreditFilters = {}) => {
  const conditions: SQL<unknown>[] = [];

  if (filters.customerId !== undefined) {
    conditions.push(eq(credits.customerId, filters.customerId));
  }

  if (filters.status) {
    conditions.push(eq(credits.status, filters.status));
  }

  if (filters.type) {
    conditions.push(eq(credits.type, filters.type));
  }

  if (filters.startDate) {
    conditions.push(gte(credits.createdAt, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(credits.createdAt, filters.endDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const creditRows = await db.select().from(credits).where(whereClause);

  return {
    totalCredits: creditRows.reduce((sum: number, credit) => sum + Number(credit.amount), 0),
    totalBalance: creditRows.reduce((sum: number, credit) => sum + Number(credit.balance), 0),
    activeCredits: creditRows.filter(credit => credit.status === 'active').length,
    usedCredits: creditRows.filter(credit => credit.status === 'used').length,
    expiredCredits: creditRows.filter(credit => credit.status === 'expired').length,
  };
};

export const getCustomerCreditSummary = async (customerId: number) => {
  const credits = await getCustomerCredits(customerId);
  const activeCredits = credits.filter(c => c.status === 'active');
  
  return {
    customerId,
    totalCredits: credits.reduce((sum: number, c) => sum + Number(c.amount), 0),
    availableBalance: activeCredits.reduce((sum: number, c) => sum + Number(c.balance), 0),
    activeCreditCount: activeCredits.length,
    credits,
  };
};

export const getCreditUsageHistory = async (creditId: number) => {
  return await db
    .select({
      id: creditUsage.id,
      saleId: creditUsage.saleId,
      amountUsed: creditUsage.amountUsed,
      usedAt: creditUsage.usedAt,
    })
    .from(creditUsage)
    .where(eq(creditUsage.creditId, creditId))
    .orderBy(creditUsage.usedAt);
};
