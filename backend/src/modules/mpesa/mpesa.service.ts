import { db } from '../../db/client';
import { mpesaTransactions, payments, sales } from '../../db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

export interface MpesaCallbackData {
  TransactionType?: string;
  TransID?: string;
  TransTime?: string;
  TransAmount?: string;
  BusinessShortCode?: string;
  BillRefNumber?: string;
  InvoiceNumber?: string;
  OrgAccountBalance?: string;
  ThirdPartyTransID?: string;
  MSISDN?: string;
  FirstName?: string;
  MiddleName?: string;
  LastName?: string;
}

export interface MpesaTransactionFilters {
  phoneNumber?: string;
  status?: 'pending' | 'completed' | 'failed';
  transactionType?: 'payment' | 'refund' | 'transfer';
  dateFrom?: Date;
  dateTo?: Date;
}

export class MpesaService {
  // Process M-Pesa callback
  async processCallback(callbackData: MpesaCallbackData): Promise<{ success: boolean; message: string; transaction?: any }> {
    try {
      // Validate required fields
      if (!callbackData.TransID || !callbackData.MSISDN || !callbackData.TransAmount) {
        return {
          success: false,
          message: 'Missing required transaction data'
        };
      }

      // Check if transaction already exists
      const existingTransaction = await this.getTransactionByMpesaId(callbackData.TransID);
      if (existingTransaction) {
        return {
          success: false,
          message: 'Transaction already processed'
        };
      }

      // Parse amount
      const amount = parseFloat(callbackData.TransAmount || '0');
      if (isNaN(amount) || amount <= 0) {
        return {
          success: false,
          message: 'Invalid transaction amount'
        };
      }

      // Create transaction record
      const newTransaction = {
        transactionId: callbackData.TransID,
        phoneNumber: callbackData.MSISDN,
        amount: amount.toString(),
        reference: callbackData.BillRefNumber,
        transactionType: callbackData.TransactionType || 'payment',
        status: 'completed',
        businessShortcode: callbackData.BusinessShortCode,
        accountNumber: callbackData.OrgAccountBalance,
        transactionDate: new Date(callbackData.TransTime || ''),
        processedAt: new Date(),
        metadata: JSON.stringify({
          firstName: callbackData.FirstName,
          middleName: callbackData.MiddleName,
          lastName: callbackData.LastName,
          invoiceNumber: callbackData.InvoiceNumber,
          thirdPartyTransId: callbackData.ThirdPartyTransID
        })
      };

      const result = await db.insert(mpesaTransactions).values(newTransaction).returning();
      const transaction = result[0];

      // Try to match with existing payment or sale
      await this.matchTransactionWithPayment(transaction);

      return {
        success: true,
        message: 'Transaction processed successfully',
        transaction
      };
    } catch (error) {
      console.error('M-Pesa callback processing error:', error);
      return {
        success: false,
        message: 'Internal server error'
      };
    }
  }

  // Get transactions with filters
  async getTransactions(filters?: MpesaTransactionFilters): Promise<any[]> {
    let query = db.select().from(mpesaTransactions);
    
    const conditions = [];
    
    if (filters?.phoneNumber) {
      conditions.push(eq(mpesaTransactions.phoneNumber, filters.phoneNumber));
    }
    
    if (filters?.status) {
      conditions.push(eq(mpesaTransactions.status, filters.status));
    }
    
    if (filters?.transactionType) {
      conditions.push(eq(mpesaTransactions.transactionType, filters.transactionType));
    }
    
    if (filters?.dateFrom) {
      conditions.push(gte(mpesaTransactions.transactionDate, filters.dateFrom));
    }
    
    if (filters?.dateTo) {
      conditions.push(lte(mpesaTransactions.transactionDate, filters.dateTo));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(mpesaTransactions.transactionDate));
  }

  // Get transaction by M-Pesa transaction ID
  async getTransactionByMpesaId(transactionId: string): Promise<any> {
    const result = await db
      .select()
      .from(mpesaTransactions)
      .where(eq(mpesaTransactions.transactionId, transactionId))
      .limit(1);
    
    return result[0] || null;
  }

  // Get transaction by database ID
  async getTransactionById(id: number): Promise<any> {
    const result = await db
      .select()
      .from(mpesaTransactions)
      .where(eq(mpesaTransactions.id, id))
      .limit(1);
    
    return result[0] || null;
  }

  // Match transaction with existing payment or sale
  private async matchTransactionWithPayment(mpesaTransaction: any): Promise<void> {
    try {
      // Try to find matching payment by amount and recent date
      const amount = Number(mpesaTransaction.amount);
      const transactionDate = new Date(mpesaTransaction.transactionDate);
      const searchDate = new Date(transactionDate.getTime() - 24 * 60 * 60 * 1000); // Search within last 24 hours

      const matchingPayments = await db
        .select()
        .from(payments)
        .where(and(
          eq(payments.amount, amount.toString()),
          eq(payments.status, 'pending'),
          gte(payments.paymentDate, searchDate)
        ))
        .limit(5);

      // If we find a matching payment, update it
      if (matchingPayments.length > 0) {
        const payment = matchingPayments[0];
        
        await db
          .update(payments)
          .set({
            status: 'completed',
            paymentMethod: 'mpesa',
            transactionId: mpesaTransaction.transactionId,
            notes: `Automatically matched with M-Pesa transaction ${mpesaTransaction.transactionId}`
          })
          .where(eq(payments.id, payment.id));

        console.log(`M-Pesa transaction ${mpesaTransaction.transactionId} matched with payment ${payment.id}`);
      }
    } catch (error) {
      console.error('Error matching M-Pesa transaction with payment:', error);
    }
  }

  // Get transaction statistics
  async getTransactionStats(customerId?: number, dateFrom?: Date, dateTo?: Date): Promise<{
    totalAmount: number;
    transactionCount: number;
    successfulTransactions: number;
    failedTransactions: number;
    averageTransactionAmount: number;
  }> {
    let query = db.select().from(mpesaTransactions);
    
    const conditions = [];
    
    if (dateFrom) {
      conditions.push(gte(mpesaTransactions.transactionDate, dateFrom));
    }
    
    if (dateTo) {
      conditions.push(lte(mpesaTransactions.transactionDate, dateTo));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const transactions = await query;
    
    const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const successfulTransactions = transactions.filter(t => t.status === 'completed').length;
    const failedTransactions = transactions.filter(t => t.status === 'failed').length;
    const averageTransactionAmount = transactions.length > 0 ? totalAmount / transactions.length : 0;

    return {
      totalAmount,
      transactionCount: transactions.length,
      successfulTransactions,
      failedTransactions,
      averageTransactionAmount
    };
  }

  // Reconcile transactions
  async reconcileTransactions(dateFrom: Date, dateTo: Date): Promise<{
    reconciled: number;
    unreconciled: number;
    totalAmount: number;
    details: any[];
  }> {
    // Get all M-Pesa transactions in date range
    const mpesaTxns = await this.getTransactions({
      dateFrom,
      dateTo,
      status: 'completed'
    });

    // Get all payments in date range
    const paymentsInRange = await db
      .select()
      .from(payments)
      .where(and(
        gte(payments.paymentDate, dateFrom),
        lte(payments.paymentDate, dateTo),
        eq(payments.paymentMethod, 'mpesa')
      ));

    const reconciled = [];
    const unreconciled = [];

    // Match transactions
    for (const mpesaTxn of mpesaTxns) {
      const matchingPayment = paymentsInRange.find(p => 
        p.transactionId === mpesaTxn.transactionId || 
        Number(p.amount) === Number(mpesaTxn.amount)
      );

      if (matchingPayment) {
        reconciled.push({
          mpesaTransaction: mpesaTxn,
          payment: matchingPayment,
          status: 'matched'
        });
      } else {
        unreconciled.push(mpesaTxn);
      }
    }

    const totalAmount = mpesaTxns.reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      reconciled: reconciled.length,
      unreconciled: unreconciled.length,
      totalAmount,
      details: [...reconciled, ...unreconciled.map(t => ({ ...t, status: 'unmatched' }))]
    };
  }

  // Generate M-Pesa STK Push request
  async generateStkPush(phoneNumber: string, amount: number, accountReference: string, transactionDesc: string): Promise<{
    success: boolean;
    checkoutRequestID?: string;
    responseDescription?: string;
    error?: string;
  }> {
    try {
      // This would integrate with actual M-Pesa API
      // For now, return a mock response
      const checkoutRequestID = `CHECKOUT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // In production, you would make actual API call to M-Pesa
      // const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      //   BusinessShortCode: process.env.MPESA_SHORTCODE,
      //   Password: process.env.MPESA_PASSWORD,
      //   Timestamp: timestamp,
      //   TransactionType: 'CustomerPayBillOnline',
      //   Amount: amount,
      //   PartyA: phoneNumber,
      //   PartyB: process.env.MPESA_SHORTCODE,
      //   PhoneNumber: phoneNumber,
      //   CallBackURL: process.env.MPESA_CALLBACK_URL,
      //   AccountReference: accountReference,
      //   TransactionDesc: transactionDesc,
      //   CheckoutRequestID: checkoutRequestID
      // });

      return {
        success: true,
        checkoutRequestID,
        responseDescription: 'Success. Request accepted for processing'
      };
    } catch (error) {
      console.error('STK Push generation error:', error);
      return {
        success: false,
        error: 'Failed to generate STK push request'
      };
    }
  }

  // Validate M-Pesa callback signature (security)
  validateCallbackSignature(data: any, signature: string): boolean {
    // In production, implement actual signature validation
    // using M-Pesa public key or shared secret
    try {
      // const crypto = require('crypto');
      // const isValid = crypto.verify(data, signature, process.env.MPESA_PUBLIC_KEY);
      // return isValid;
      
      // For now, return true (implement proper validation in production)
      return true;
    } catch (error) {
      console.error('Signature validation error:', error);
      return false;
    }
  }
}
