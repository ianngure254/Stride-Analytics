ALTER TABLE "sales" ALTER COLUMN "customer_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "payment_method" varchar(50);
