import { db } from './db';

export interface SalesReportData {
  saleId: number;
  date: string;
  customerName: string;
  customerPhone?: string;
  items: string;
  totalAmount: string;
  paymentMethod: string;
  status: string;
}

export async function generateSalesReport(
  startDate: Date,
  endDate: Date
): Promise<SalesReportData[]> {
  // Get all sales from IndexedDB
  const allSales = await db.sales
    .filter(sale => !sale._deleted)
    .toArray();

  // Filter by date range
  const filteredSales = allSales.filter(sale => {
    const saleDate = new Date(sale.saleDate);
    return saleDate >= startDate && saleDate <= endDate;
  });

  const reportData: SalesReportData[] = [];

  for (const sale of filteredSales) {
    // Get sale items from IndexedDB
    const saleItems = await db.saleItems
      .filter(item => item.saleId === sale.id && !item._deleted)
      .toArray();

    // Get customer info if customerId exists
    let customerName = 'Walk-in Customer';
    let customerPhone: string | undefined;
    if (sale.customerId) {
      const customer = await db.customers.get(sale.customerId);
      if (customer && !customer._deleted) {
        customerName = customer.name;
        customerPhone = customer.phone;
      }
    }

    const items: string[] = [];
    for (const item of saleItems) {
      // Try to get product name from products table
      let productName = 'Unknown Product';
      if (item.productId) {
        const product = await db.products.get(item.productId);
        if (product && !product._deleted) {
          productName = product.name;
        }
      }
      items.push(`${productName}(${item.quantity})`);
    }

    reportData.push({
      saleId: sale.id!,
      date: new Date(sale.saleDate).toLocaleDateString(),
      customerName,
      customerPhone,
      items: items.join(', '),
      totalAmount: sale.totalAmount,
      paymentMethod: sale.paymentMethod || 'N/A',
      status: sale.status,
    });
  }

  return reportData;
}

export function downloadCSV(data: SalesReportData[], filename: string): void {
  const headers = ['Sale ID', 'Date', 'Customer', 'Phone', 'Items', 'Total Amount', 'Payment Method', 'Status'];
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      row.saleId,
      row.date,
      `"${row.customerName}"`,
      row.customerPhone || '',
      `"${row.items}"`,
      row.totalAmount,
      row.paymentMethod,
      row.status,
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateDailyReport(date: Date = new Date()): Promise<SalesReportData[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return generateSalesReport(startOfDay, endOfDay);
}

export function generateWeeklyReport(startDate: Date = new Date()): Promise<SalesReportData[]> {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  return generateSalesReport(start, endDate);
}

export function generateMonthlyReport(year: number, month: number): Promise<SalesReportData[]> {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
  
  return generateSalesReport(startDate, endDate);
}

export function getCurrentMonthReport(): Promise<SalesReportData[]> {
  const now = new Date();
  return generateMonthlyReport(now.getFullYear(), now.getMonth());
}

export function getCurrentWeekReport(): Promise<SalesReportData[]> {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  
  return generateWeeklyReport(startOfWeek);
}
