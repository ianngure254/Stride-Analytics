import { db } from '../../db/client';
import { customerDebts, sales, customers, payments } from '../../db/schema';
import { eq, and, desc, gte, lte, sum, lt } from 'drizzle-orm';

export interface DebtFilters {
  customerId?: number;
  status?: 'pending' | 'partial' | 'paid' | 'overdue';
  dueDateFrom?: Date;
  dueDateTo?: Date;
  includeOverdueOnly?: boolean;
}

export interface CreateDebtRequest {
  customerId: number;
  saleId?: number;
  amount: number;
  dueDate: Date;
  notes?: string;
}

export interface UpdateDebtRequest {
  status?: 'pending' | 'partial' | 'paid' | 'overdue';
  paidAmount?: number;
  reminderSent?: boolean;
  lastReminderDate?: Date;
}

export interface DebtAnalytics {
  totalDebt: number;
  totalPaid: number;
  outstandingBalance: number;
  overdueAmount: number;
  debtCount: number;
  overdueCount: number;
  averageDebtAge: number;
  paymentTrend: {
    period: string;
    amount: number;
  }[];
}

export class DebtManagementService {
  // Get customer debts with filters
  async getDebts(filters?: DebtFilters): Promise<any[]> {
    let query = db.select().from(customerDebts);
    
    const conditions = [];
    
    if (filters?.customerId !== undefined) {
      conditions.push(eq(customerDebts.customerId, filters.customerId));
    }
    
    if (filters?.status !== undefined) {
      conditions.push(eq(customerDebts.status, filters.status));
    }
    
    if (filters?.dueDateFrom !== undefined) {
      conditions.push(gte(customerDebts.dueDate, filters.dueDateFrom));
    }
    
    if (filters?.dueDateTo !== undefined) {
      conditions.push(lte(customerDebts.dueDate, filters.dueDateTo));
    }
    
    if (filters?.includeOverdueOnly) {
      const now = new Date();
      conditions.push(and(
        lt(customerDebts.dueDate, now),
        eq(customerDebts.status, 'pending')
      ));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(customerDebts.createdAt));
  }

  // Get debt by ID
  async getDebtById(id: number): Promise<any> {
    const result = await db
      .select()
      .from(customerDebts)
      .where(eq(customerDebts.id, id))
      .limit(1);
    
    return result[0] || null;
  }

  // Create new debt record
  async createDebt(data: CreateDebtRequest): Promise<any> {
    try {
      const newDebt = {
        customerId: data.customerId,
        saleId: data.saleId || null,
        amount: data.amount.toString(),
        paidAmount: '0',
        balance: data.amount.toString(),
        dueDate: data.dueDate,
        status: 'pending',
        reminderSent: false,
        lastReminderDate: null,
      };
      
      const result = await db.insert(customerDebts).values(newDebt).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating debt record:', error);
      throw error;
    }
  }

  // Update debt record
  async updateDebt(id: number, data: UpdateDebtRequest): Promise<any> {
    try {
      const updateData: any = {};
      
      if (data.status !== undefined) {
        updateData.status = data.status;
      }
      
      if (data.paidAmount !== undefined) {
        updateData.paidAmount = data.paidAmount.toString();
        // Calculate new balance
        const currentDebt = await this.getDebtById(id);
        if (currentDebt) {
          const totalPaid = Number(data.paidAmount);
          const originalAmount = Number(currentDebt.amount);
          const newBalance = Math.max(0, originalAmount - totalPaid);
          updateData.balance = newBalance.toString();
          
          // Auto-update status based on payment
          if (newBalance === 0) {
            updateData.status = 'paid';
          } else if (totalPaid > 0) {
            updateData.status = 'partial';
          }
        }
      }
      
      if (data.reminderSent !== undefined) {
        updateData.reminderSent = data.reminderSent;
      }
      
      if (data.lastReminderDate !== undefined) {
        updateData.lastReminderDate = data.lastReminderDate;
      }
      
      const result = await db
        .update(customerDebts)
        .set(updateData)
        .where(eq(customerDebts.id, id))
        .returning();
      
      return result[0] || null;
    } catch (error) {
      console.error('Error updating debt record:', error);
      throw error;
    }
  }

  // Delete debt record
  async deleteDebt(id: number): Promise<boolean> {
    try {
      const result = await db.delete(customerDebts).where(eq(customerDebts.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting debt record:', error);
      return false;
    }
  }

  // Detect overdue debts and update their status
  async detectOverdueDebts(): Promise<number> {
    try {
      const now = new Date();
      
      // Get all pending debts that are overdue
      const overdueDebts = await db
        .select()
        .from(customerDebts)
        .where(and(
          lt(customerDebts.dueDate, now),
          eq(customerDebts.status, 'pending')
        ));
      
      let updatedCount = 0;
      
      // Update each overdue debt
      for (const debt of overdueDebts) {
        await db
          .update(customerDebts)
          .set({ status: 'overdue' })
          .where(eq(customerDebts.id, debt.id));
        updatedCount++;
      }
      
      console.log(`Updated ${updatedCount} overdue debt records`);
      return updatedCount;
    } catch (error) {
      console.error('Error detecting overdue debts:', error);
      return 0;
    }
  }

  // Send payment reminders for overdue debts
  async sendPaymentReminders(daysBeforeDue: number = 7): Promise<{
    sent: number;
    failed: number;
    details: any[];
  }> {
    try {
      const reminderDate = new Date();
      const dueDateThreshold = new Date(reminderDate.getTime() + daysBeforeDue * 24 * 60 * 60 * 1000);
      
      // Get debts that need reminders
      const debtsNeedingReminder = await db
        .select()
        .from(customerDebts)
        .where(and(
          lte(customerDebts.dueDate, dueDateThreshold),
          eq(customerDebts.reminderSent, false)
        ));
      
      let sent = 0;
      let failed = 0;
      const details = [];
      
      for (const debt of debtsNeedingReminder) {
        try {
          // Get customer details
          const customer = await db
            .select()
            .from(customers)
            .where(eq(customers.id, debt.customerId))
            .limit(1);
          
          if (customer[0]) {
            // In a real implementation, send SMS/email here
            // await this.sendReminderSMS(customer[0].phone, debt);
            // await this.sendReminderEmail(customer[0].email, debt);
            
            // Mark reminder as sent
            await db
              .update(customerDebts)
              .set({
                reminderSent: true,
                lastReminderDate: reminderDate
              })
              .where(eq(customerDebts.id, debt.id));
            
            sent++;
            details.push({
              debt,
              customer: customer[0],
              status: 'sent'
            });
          } else {
            failed++;
            details.push({
              debt,
              customer: null,
              status: 'failed - customer not found'
            });
          }
        } catch (error) {
          failed++;
          details.push({
            debt,
            customer: null,
            status: `failed - ${error.message}`
          });
        }
      }
      
      return { sent, failed, details };
    } catch (error) {
      console.error('Error sending payment reminders:', error);
      return { sent: 0, failed: 0, details: [] };
    }
  }

  // Get comprehensive debt analytics
  async getDebtAnalytics(customerId?: number, dateFrom?: Date, dateTo?: Date): Promise<DebtAnalytics> {
    try {
      let query = db.select().from(customerDebts);
      
      const conditions = [];
      if (customerId !== undefined) {
        conditions.push(eq(customerDebts.customerId, customerId));
      }
      if (dateFrom !== undefined) {
        conditions.push(gte(customerDebts.createdAt, dateFrom));
      }
      if (dateTo !== undefined) {
        conditions.push(lte(customerDebts.createdAt, dateTo));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      const debts = await query;
      
      // Calculate analytics
      const totalDebt = debts.reduce((sum, debt) => sum + Number(debt.amount), 0);
      const totalPaid = debts.reduce((sum, debt) => sum + Number(debt.paidAmount), 0);
      const outstandingBalance = debts.reduce((sum, debt) => sum + Number(debt.balance), 0);
      
      const now = new Date();
      const overdueDebts = debts.filter(debt => 
        new Date(debt.dueDate) < now && debt.status !== 'paid'
      );
      const overdueAmount = overdueDebts.reduce((sum, debt) => sum + Number(debt.balance), 0);
      
      const debtCount = debts.length;
      const overdueCount = overdueDebts.length;
      
      // Calculate average debt age
      const totalAge = debts.reduce((sum, debt) => {
        const age = Math.floor((now.getTime() - new Date(debt.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return sum + age;
      }, 0);
      const averageDebtAge = debtCount > 0 ? totalAge / debtCount : 0;
      
      // Calculate payment trend (last 6 months)
      const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
      const paymentTrend = await db
        .select({
          period: customerDebts.createdAt,
          amount: sum(customerDebts.paidAmount)
        })
        .from(customerDebts)
        .where(and(
          gte(customerDebts.createdAt, sixMonthsAgo),
          eq(customerDebts.status, 'partial')
        ))
        .groupBy(customerDebts.createdAt)
        .orderBy(customerDebts.createdAt);
      
      return {
        totalDebt,
        totalPaid,
        outstandingBalance,
        overdueAmount,
        debtCount,
        overdueCount,
        averageDebtAge,
        paymentTrend: paymentTrend.map(t => ({
          period: new Date(t.period).toLocaleDateString(),
          amount: Number(t.amount) || 0
        }))
      };
    } catch (error) {
      console.error('Error calculating debt analytics:', error);
      return {
        totalDebt: 0,
        totalPaid: 0,
        outstandingBalance: 0,
        overdueAmount: 0,
        debtCount: 0,
        overdueCount: 0,
        averageDebtAge: 0,
        paymentTrend: []
      };
    }
  }

  // Create debt from unpaid sale
  async createDebtFromSale(saleId: number, dueDays: number = 30): Promise<any> {
    try {
      // Get sale details
      const saleResult = await db
        .select()
        .from(sales)
        .where(eq(sales.id, saleId))
        .limit(1);
      
      if (!saleResult[0]) {
        throw new Error('Sale not found');
      }
      
      const sale = saleResult[0];
      
      // Check if debt already exists for this sale
      const existingDebt = await db
        .select()
        .from(customerDebts)
        .where(eq(customerDebts.saleId, saleId))
        .limit(1);
      
      if (existingDebt[0]) {
        throw new Error('Debt already exists for this sale');
      }
      
      // Create debt record
      const dueDate = new Date(sale.saleDate.getTime() + dueDays * 24 * 60 * 60 * 1000);
      
      return await this.createDebt({
        customerId: sale.customerId,
        saleId: sale.id,
        amount: Number(sale.totalAmount),
        dueDate,
        notes: `Auto-generated from sale ${sale.id}`
      });
    } catch (error) {
      console.error('Error creating debt from sale:', error);
      throw error;
    }
  }

  // Apply payment to debt
  async applyPaymentToDebt(debtId: number, paymentAmount: number, paymentMethod: string = 'cash'): Promise<{
    success: boolean;
    debt?: any;
    message: string;
  }> {
    try {
      const debt = await this.getDebtById(debtId);
      if (!debt) {
        return {
          success: false,
          message: 'Debt not found'
        };
      }
      
      const currentBalance = Number(debt.balance);
      const appliedAmount = Math.min(paymentAmount, currentBalance);
      const newBalance = currentBalance - appliedAmount;
      
      // Update debt record
      const updatedDebt = await this.updateDebt(debtId, {
        paidAmount: (Number(debt.paidAmount) + appliedAmount).toString(),
        status: newBalance === 0 ? 'paid' : 'partial'
      });
      
      // Create payment record
      if (appliedAmount > 0) {
        await db.insert(payments).values({
          saleId: debt.saleId,
          amount: appliedAmount.toString(),
          paymentMethod,
          status: 'completed',
          paymentDate: new Date(),
          notes: `Payment applied to debt ${debtId}`
        });
      }
      
      return {
        success: true,
        debt: updatedDebt,
        message: `Payment of ${appliedAmount} applied successfully`
      };
    } catch (error) {
      console.error('Error applying payment to debt:', error);
      return {
        success: false,
        message: 'Failed to apply payment'
      };
    }
  }
}
