BEGIN;

INSERT INTO units (code, name, dimension, multiplier_to_base, sort_order) VALUES
  ('g', 'gram', 'mass', 1.0000, 1),
  ('kg', 'kilogram', 'mass', 1000.0000, 2),
  ('t', 'tonne', 'mass', 1000000.0000, 3),
  ('ml', 'millilitre', 'volume', 1.0000, 4),
  ('l', 'litre', 'volume', 1000.0000, 5),
  ('pc', 'piece', 'count', 1.0000, 6),
  ('roll', 'roll', 'count', 1.0000, 7)
ON CONFLICT (code) DO NOTHING;

INSERT INTO unit_conversions (from_unit_id, to_unit_id, factor)
SELECT g.id, kg.id, 0.0010
FROM units g
JOIN units kg ON kg.code = 'kg'
WHERE g.code = 'g'
ON CONFLICT (from_unit_id, to_unit_id) DO NOTHING;

INSERT INTO unit_conversions (from_unit_id, to_unit_id, factor)
SELECT kg.id, g.id, 1000.0000
FROM units kg
JOIN units g ON g.code = 'g'
WHERE kg.code = 'kg'
ON CONFLICT (from_unit_id, to_unit_id) DO NOTHING;

INSERT INTO unit_conversions (from_unit_id, to_unit_id, factor)
SELECT kg.id, t.id, 0.0010
FROM units kg
JOIN units t ON t.code = 't'
WHERE kg.code = 'kg'
ON CONFLICT (from_unit_id, to_unit_id) DO NOTHING;

INSERT INTO unit_conversions (from_unit_id, to_unit_id, factor)
SELECT t.id, kg.id, 1000.0000
FROM units t
JOIN units kg ON kg.code = 'kg'
WHERE t.code = 't'
ON CONFLICT (from_unit_id, to_unit_id) DO NOTHING;

INSERT INTO unit_conversions (from_unit_id, to_unit_id, factor)
SELECT ml.id, l.id, 0.0010
FROM units ml
JOIN units l ON l.code = 'l'
WHERE ml.code = 'ml'
ON CONFLICT (from_unit_id, to_unit_id) DO NOTHING;

INSERT INTO unit_conversions (from_unit_id, to_unit_id, factor)
SELECT l.id, ml.id, 1000.0000
FROM units l
JOIN units ml ON ml.code = 'ml'
WHERE l.code = 'l'
ON CONFLICT (from_unit_id, to_unit_id) DO NOTHING;

COMMIT;
