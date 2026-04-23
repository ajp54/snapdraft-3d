export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function roundToNearest(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

export function snapValue(value: number, increment: number, threshold: number = 0.5): number {
  const remainder = Math.abs(value % increment);
  if (remainder < threshold || remainder > increment - threshold) {
    return roundToNearest(value, increment);
  }
  return value;
}

export function getGridPosition(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function normalizeAngle(degrees: number): number {
  let normalized = degrees % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
}
