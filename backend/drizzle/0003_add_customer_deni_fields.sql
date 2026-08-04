ALTER TABLE "customers" ADD COLUMN "pending_amount" numeric(10, 2) DEFAULT '0';
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "deni_status" varchar(20) DEFAULT 'pending';
