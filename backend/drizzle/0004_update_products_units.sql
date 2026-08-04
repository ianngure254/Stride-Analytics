-- Update products table to ensure proper unit field with hardware store units
-- Add unit field if it doesn't exist
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "unit" varchar(30) DEFAULT 'pcs';

-- Add stock field as decimal for fractional quantities
ALTER TABLE "products" ALTER COLUMN "stock" TYPE numeric(12, 3) USING stock::numeric(12, 3);

-- Add reorder_level field if it doesn't exist
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "reorder_level" numeric(12, 3) DEFAULT '10';

-- Update sale_items to support fractional quantities and units
ALTER TABLE "sale_items" ALTER COLUMN "quantity" TYPE numeric(12, 3) USING quantity::numeric(12, 3);
ALTER TABLE "sale_items" ADD COLUMN IF NOT EXISTS "unit" varchar(30) DEFAULT 'pcs';

-- Update existing products to have appropriate units
UPDATE "products" SET "unit" = 'pcs' WHERE "unit" IS NULL OR "unit" = '';
