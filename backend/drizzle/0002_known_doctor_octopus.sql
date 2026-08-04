ALTER TABLE "ai_usage_tracking" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "billing_plans" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "business_insights" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "customer_debts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "generated_reports" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invoices" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "mpesa_transactions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "quotations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "report_templates" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "staff_accounts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscriptions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "ai_usage_tracking" CASCADE;--> statement-breakpoint
DROP TABLE "billing_plans" CASCADE;--> statement-breakpoint
DROP TABLE "business_insights" CASCADE;--> statement-breakpoint
DROP TABLE "customer_debts" CASCADE;--> statement-breakpoint
DROP TABLE "generated_reports" CASCADE;--> statement-breakpoint
DROP TABLE "invoices" CASCADE;--> statement-breakpoint
DROP TABLE "mpesa_transactions" CASCADE;--> statement-breakpoint
DROP TABLE "quotations" CASCADE;--> statement-breakpoint
DROP TABLE "report_templates" CASCADE;--> statement-breakpoint
DROP TABLE "staff_accounts" CASCADE;--> statement-breakpoint
DROP TABLE "subscriptions" CASCADE;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "stock" SET DATA TYPE numeric(12, 3);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "stock" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "sale_items" ALTER COLUMN "quantity" SET DATA TYPE numeric(12, 3);--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "customer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "pending_amount" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "deni_status" varchar(20) DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "unit" varchar(30) DEFAULT 'pcs' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "reorder_level" numeric(12, 3) DEFAULT '10' NOT NULL;--> statement-breakpoint
ALTER TABLE "sale_items" ADD COLUMN "unit" varchar(30) DEFAULT 'pcs' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "payment_method" varchar(50);