BEGIN;

CREATE TABLE IF NOT EXISTS units (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  dimension TEXT NOT NULL,
  multiplier_to_base NUMERIC(12, 4) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS base_stock BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_unit_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_base_unit_id_fkey'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_base_unit_id_fkey
      FOREIGN KEY (base_unit_id) REFERENCES units(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS product_units (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  conversion_factor NUMERIC(12, 4) NOT NULL,
  alias TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, unit_id)
);

CREATE TABLE IF NOT EXISTS unit_conversions (
  id SERIAL PRIMARY KEY,
  from_unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  to_unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  factor NUMERIC(12, 4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_unit_id, to_unit_id)
);

ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS unit_id INTEGER,
  ADD COLUMN IF NOT EXISTS quantity_in_base BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit_quantity NUMERIC(12, 4),
  ADD COLUMN IF NOT EXISTS unit_label TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sale_items_unit_id_fkey'
  ) THEN
    ALTER TABLE sale_items
      ADD CONSTRAINT sale_items_unit_id_fkey
      FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;
