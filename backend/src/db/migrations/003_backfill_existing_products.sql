BEGIN;

DO $$
DECLARE
  default_unit_id INTEGER;
BEGIN
  SELECT id INTO default_unit_id FROM units WHERE code = 'pc' LIMIT 1;

  IF default_unit_id IS NULL THEN
    RAISE EXCEPTION 'Default unit % not found. Run 002_seed_units.sql first.', 'pc';
  END IF;

  UPDATE products
  SET base_unit_id = COALESCE(base_unit_id, default_unit_id),
      base_stock = COALESCE(base_stock, stock::BIGINT)
  WHERE base_unit_id IS NULL OR base_stock IS NULL;

  INSERT INTO product_units (product_id, unit_id, conversion_factor, alias, is_default, is_active)
  SELECT p.id, default_unit_id, 1.0000, 'default', TRUE, TRUE
  FROM products p
  WHERE NOT EXISTS (
    SELECT 1
    FROM product_units pu
    WHERE pu.product_id = p.id
      AND pu.unit_id = default_unit_id
  );

  UPDATE sale_items
  SET unit_id = COALESCE(unit_id, default_unit_id),
      unit_quantity = COALESCE(unit_quantity, quantity::NUMERIC(12, 4)),
      quantity_in_base = COALESCE(quantity_in_base, quantity::BIGINT)
  WHERE unit_id IS NULL;
END $$;

COMMIT;
