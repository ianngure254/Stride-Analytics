import { pgTable, serial, varchar, timestamp, integer, decimal, boolean, text } from 'drizzle-orm/pg-core';

// Customers table
export const customers = pgTable('customers', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).unique(),
    phone: varchar('phone', { length: 20 }),
    address: text('address'),
    pendingAmount: decimal('pending_amount', { precision: 10, scale: 2 }).default('0'),
    deniStatus: varchar('deni_status', { length: 20 }).default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Products table
export const products = pgTable('products', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    stock: decimal('stock', { precision: 12, scale: 3 }).default('0').notNull(),
    unit: varchar('unit', { length: 30 }).default('pcs').notNull(),
    reorderLevel: decimal('reorder_level', { precision: 12, scale: 3 }).default('10').notNull(),
    category: varchar('category', { length: 100 }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sales table
export const sales = pgTable('sales', {
    id: serial('id').primaryKey(),
    customerId: integer('customer_id').references(() => customers.id),
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(), // pending, completed, cancelled
    paymentMethod: varchar('payment_method', { length: 50 }), // M-Pesa, Cash, Credit
    saleDate: timestamp('sale_date').defaultNow().notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sale Items table (junction table for sales and products)
export const saleItems = pgTable('sale_items', {
    id: serial('id').primaryKey(),
    saleId: integer('sale_id').references(() => sales.id).notNull(),
    productId: integer('product_id').references(() => products.id).notNull(),
    quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
    unit: varchar('unit', { length: 30 }).default('pcs').notNull(),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Payments table
export const payments = pgTable('payments', {
    id: serial('id').primaryKey(),
    saleId: integer('sale_id').references(() => sales.id).notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // cash, card, transfer, etc.
    status: varchar('status', { length: 50 }).notNull(), // pending, completed, failed
    paymentDate: timestamp('payment_date').defaultNow().notNull(),
    transactionId: varchar('transaction_id', { length: 255 }),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Credits table
export const credits = pgTable('credits', {
    id: serial('id').primaryKey(),
    customerId: integer('customer_id').references(() => customers.id).notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // credit, refund, discount
    reason: text('reason'),
    status: varchar('status', { length: 50 }).notNull(), // active, used, expired
    balance: decimal('balance', { precision: 10, scale: 2 }).notNull(),
    expiryDate: timestamp('expiry_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Credit Usage table (tracks when credits are used)
export const creditUsage = pgTable('credit_usage', {
    id: serial('id').primaryKey(),
    creditId: integer('credit_id').references(() => credits.id).notNull(),
    saleId: integer('sale_id').references(() => sales.id).notNull(),
    amountUsed: decimal('amount_used', { precision: 10, scale: 2 }).notNull(),
    usedAt: timestamp('used_at').defaultNow().notNull(),
});


// Export types for TypeScript
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
export type SaleItem = typeof saleItems.$inferSelect;
export type NewSaleItem = typeof saleItems.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type Credit = typeof credits.$inferSelect;
export type NewCredit = typeof credits.$inferInsert;
export type CreditUsage = typeof creditUsage.$inferSelect;
export type NewCreditUsage = typeof creditUsage.$inferInsert;

// Supported units of measure
export const UNITS_OF_MEASURE = [
  { value: 'pcs',    label: 'Pieces',      hint: 'Nails, bolts, hinges' },
  { value: 'kg',     label: 'Kilograms',   hint: 'Sand, aggregate (small)' },
  { value: 'tonnes', label: 'Tonnes',      hint: 'Cement, steel, aggregate' },
  { value: 'g',      label: 'Grams',       hint: 'Small hardware' },
  { value: 'litres', label: 'Litres',      hint: 'Paint, fuel, lubricants' },
  { value: 'ml',     label: 'Millilitres', hint: 'Small liquids' },
  { value: 'rolls',  label: 'Rolls',       hint: 'Barbed wire, pipes' },
  { value: 'bags',   label: 'Bags',        hint: 'Cement bags, sand bags' },
  { value: 'metres', label: 'Metres',      hint: 'Pipes, timber, rebar' },
  { value: 'feet',   label: 'Feet',        hint: 'Timber, wire' },
  { value: 'pairs',  label: 'Pairs',       hint: 'Gloves, boots' },
  { value: 'boxes',  label: 'Boxes',       hint: 'Tiles, screws packs' },
  { value: 'sheets', label: 'Sheets',      hint: 'Iron sheets, plywood' },
] as const;

export type UnitOfMeasure = typeof UNITS_OF_MEASURE[number]['value'];
