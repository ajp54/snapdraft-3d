import type { Unit } from '../stores/settingsStore';

// All internal measurements are in inches
const INCHES_PER_FOOT = 12;
const MM_PER_INCH = 25.4;

export function inchesToDisplay(inches: number, unit: Unit): number {
  switch (unit) {
    case 'ft':
      return inches / INCHES_PER_FOOT;
    case 'mm':
      return inches * MM_PER_INCH;
    case 'in':
    default:
      return inches;
  }
}

export function displayToInches(value: number, unit: Unit): number {
  switch (unit) {
    case 'ft':
      return value * INCHES_PER_FOOT;
    case 'mm':
      return value / MM_PER_INCH;
    case 'in':
    default:
      return value;
  }
}

export function formatDimension(inches: number, unit: Unit): string {
  const value = inchesToDisplay(inches, unit);
  const unitLabel = unit === 'in' ? '"' : unit === 'ft' ? '\'' : 'mm';
  
  if (unit === 'mm') {
    return `${Math.round(value)}${unitLabel}`;
  }
  
  // For feet and inches, show up to 2 decimal places
  return `${(Math.round(value * 100) / 100).toFixed(2)}${unitLabel}`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function distanceBetween(
  p1: [number, number, number],
  p2: [number, number, number]
): number {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
