export const UNITS_OF_MEASURE = [
  { value: 'pcs',    label: 'Pieces',      hint: 'Nails, bolts, hinges', category: 'quantity' },
  { value: 'kg',     label: 'Kilograms',   hint: 'Sand, aggregate (small)', category: 'weight' },
  { value: 'tonnes', label: 'Tonnes',      hint: 'Cement, steel, aggregate', category: 'weight' },
  { value: 'g',      label: 'Grams',       hint: 'Small hardware', category: 'weight' },
  { value: 'litres', label: 'Litres',      hint: 'Paint, fuel, lubricants', category: 'volume' },
  { value: 'ml',     label: 'Millilitres', hint: 'Small liquids', category: 'volume' },
  { value: 'rolls',  label: 'Rolls',       hint: 'Barbed wire, pipes', category: 'quantity' },
  { value: 'bags',   label: 'Bags',        hint: 'Cement bags, sand bags', category: 'quantity' },
  { value: 'metres', label: 'Metres',      hint: 'Pipes, timber, rebar', category: 'length' },
  { value: 'feet',   label: 'Feet',        hint: 'Timber, wire', category: 'length' },
  { value: 'pairs',  label: 'Pairs',       hint: 'Gloves, boots', category: 'quantity' },
  { value: 'boxes',  label: 'Boxes',       hint: 'Tiles, screws packs', category: 'quantity' },
  { value: 'sheets', label: 'Sheets',      hint: 'Iron sheets, plywood', category: 'quantity' },
] as const;

export type UnitOfMeasure = typeof UNITS_OF_MEASURE[number]['value'];
export type UnitCategory = typeof UNITS_OF_MEASURE[number]['category'];

// Conversion factors to base units
const CONVERSION_FACTORS: Record<UnitOfMeasure, number> = {
  pcs: 1,
  kg: 1,
  tonnes: 1000, // 1 tonne = 1000 kg
  g: 0.001, // 1 g = 0.001 kg
  litres: 1,
  ml: 0.001, // 1 ml = 0.001 litres
  rolls: 1,
  bags: 1,
  metres: 1,
  feet: 0.3048, // 1 foot = 0.3048 metres
  pairs: 1,
  boxes: 1,
  sheets: 1,
};

export function convertUnits(
  quantity: number,
  fromUnit: UnitOfMeasure,
  toUnit: UnitOfMeasure
): number | null {
  // If units are the same, return original quantity
  if (fromUnit === toUnit) return quantity;

  const fromFactor = CONVERSION_FACTORS[fromUnit];
  const toFactor = CONVERSION_FACTORS[toUnit];

  // Check if units are in the same category
  const fromUnitData = UNITS_OF_MEASURE.find(u => u.value === fromUnit);
  const toUnitData = UNITS_OF_MEASURE.find(u => u.value === toUnit);

  if (!fromUnitData || !toUnitData || fromUnitData.category !== toUnitData.category) {
    return null; // Cannot convert between different categories
  }

  // Convert to base unit first, then to target unit
  const baseQuantity = quantity * fromFactor;
  return baseQuantity / toFactor;
}

export function getUnitsByCategory(category: UnitCategory) {
  return UNITS_OF_MEASURE.filter(unit => unit.category === category);
}

export function getUnitLabel(unit: UnitOfMeasure): string {
  const unitData = UNITS_OF_MEASURE.find(u => u.value === unit);
  return unitData?.label || unit;
}

export function formatQuantity(quantity: number, unit: UnitOfMeasure): string {
  // Format based on unit type for better readability
  if (unit === 'tonnes' || unit === 'kg') {
    return quantity.toFixed(2);
  }
  if (unit === 'g' || unit === 'ml') {
    return quantity.toFixed(0);
  }
  if (unit === 'litres') {
    return quantity.toFixed(1);
  }
  // For whole units, show as integer if possible
  return Number.isInteger(quantity) ? quantity.toString() : quantity.toFixed(2);
}

export function canConvert(unit1: UnitOfMeasure, unit2: UnitOfMeasure): boolean {
  const unit1Data = UNITS_OF_MEASURE.find(u => u.value === unit1);
  const unit2Data = UNITS_OF_MEASURE.find(u => u.value === unit2);
  
  if (!unit1Data || !unit2Data) return false;
  return unit1Data.category === unit2Data.category;
}

// Common fractional quantities for hardware store
export const FRACTIONAL_QUANTITIES = [
  { value: 0.25, label: '1/4', display: '¼' },
  { value: 0.5, label: '1/2', display: '½' },
  { value: 0.75, label: '3/4', display: '¾' },
] as const;

export type FractionalQuantity = typeof FRACTIONAL_QUANTITIES[number]['value'];

// Validate if a quantity is a valid fractional or whole number
export function isValidQuantity(quantity: number): boolean {
  if (quantity <= 0) return false;
  if (Number.isInteger(quantity)) return true;
  
  // Check if it's a common fraction (0.25, 0.5, 0.75) or decimal with max 3 decimal places
  const decimalPart = quantity % 1;
  const validFractions = FRACTIONAL_QUANTITIES.map(f => f.value);
  
  if (validFractions.some(f => Math.abs(decimalPart - f) < 0.001)) return true;
  
  // Allow any decimal with up to 3 decimal places for precision
  return decimalPart.toString().split('.')[1]?.length <= 3;
}

// Format quantity with fraction display for common fractions
export function formatQuantityWithFractions(quantity: number, unit: UnitOfMeasure): string {
  const wholePart = Math.floor(quantity);
  const decimalPart = quantity % 1;
  
  // Find matching fraction
  const fraction = FRACTIONAL_QUANTITIES.find(f => f.value === decimalPart);
  
  let quantityStr = '';
  if (wholePart > 0 && fraction) {
    quantityStr = `${wholePart} ${fraction.display}`;
  } else if (wholePart > 0 && !fraction) {
    quantityStr = wholePart.toString();
  } else if (fraction) {
    quantityStr = fraction.display;
  } else {
    quantityStr = quantity.toFixed(3).replace(/\.?0+$/, '');
  }
  
  return `${quantityStr} ${getUnitLabel(unit)}`;
}

// Parse fractional input (e.g., "1/2" -> 0.5, "1 1/2" -> 1.5)
export function parseFractionalInput(input: string): number | null {
  input = input.trim();
  
  // Handle mixed fractions like "1 1/2"
  const mixedMatch = input.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1]);
    const numerator = parseInt(mixedMatch[2]);
    const denominator = parseInt(mixedMatch[3]);
    return whole + (numerator / denominator);
  }
  
  // Handle simple fractions like "1/2"
  const fractionMatch = input.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1]);
    const denominator = parseInt(fractionMatch[2]);
    return numerator / denominator;
  }
  
  // Handle decimal numbers
  const decimal = parseFloat(input);
  if (!isNaN(decimal) && decimal > 0) {
    return decimal;
  }
  
  return null;
}

// Get suggested quantity options for a unit (includes fractions for certain units)
export function getQuantityOptions(unit: UnitOfMeasure): number[] {
  const baseOptions = [1, 2, 3, 4, 5, 10, 20, 50];
  
  // Add fractional options for units that commonly use fractions
  const unitsWithFractions: UnitOfMeasure[] = ['kg', 'tonnes', 'litres', 'metres', 'feet', 'bags', 'rolls'];
  
  if (unitsWithFractions.includes(unit)) {
    return [0.25, 0.5, 0.75, ...baseOptions];
  }
  
  return baseOptions;
}
