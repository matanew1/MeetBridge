// utils/inputSanitizer.ts
// [SECURITY] Input sanitization and validation utilities

/**
 * [SECURITY] Validate and sanitize numeric values
 */
function sanitizeNumber(value: any, min?: number, max?: number): number | null {
  const num = typeof value === 'number' ? value : parseFloat(value);

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  if (min !== undefined && num < min) {
    return min;
  }

  if (max !== undefined && num > max) {
    return max;
  }

  return num;
}

/**
 * [SECURITY] Sanitize object keys to prevent prototype pollution
 */
export function sanitizeObjectKeys<T extends Record<string, any>>(
  obj: T
): Partial<T> {
  const sanitized: any = {};
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

  for (const key in obj) {
    if (obj.hasOwnProperty(key) && !dangerousKeys.includes(key.toLowerCase())) {
      sanitized[key] = obj[key];
    }
  }

  return sanitized;
}

/**
 * [SECURITY] Validate array of strings
 */
export function sanitizeStringArray(
  arr: any[],
  maxLength: number = 100,
  maxItems: number = 50
): string[] {
  if (!Array.isArray(arr)) {
    return [];
  }

  return arr
    .filter((item) => typeof item === 'string')
    .map((item) => sanitizeString(item, maxLength))
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
}

/**
 * [SECURITY] Validate and sanitize age
 */
export function sanitizeAge(age: any): number | null {
  const sanitized = sanitizeNumber(age, 18, 120);
  return sanitized;
}

/**
 * [SECURITY] Validate and sanitize display name
 */
export function sanitizeDisplayName(name: string): string {
  if (typeof name !== 'string') {
    return '';
  }

  // Allow letters, numbers, spaces, and common punctuation
  const sanitized = name
    .trim()
    .replace(/[^a-zA-Z0-9\s._-]/g, '')
    .substring(0, 50);

  return sanitized.length >= 2 ? sanitized : '';
}

/**
 * [SECURITY] Validate and sanitize bio/description text
 */
export function sanitizeBio(bio: string, maxLength: number = 500): string {
  if (typeof bio !== 'string') {
    return '';
  }

  return bio
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .substring(0, maxLength);
}

/**
 * [SECURITY] Sanitize string inputs to prevent injection attacks
 */
function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML/script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, maxLength);
}

/**
 * [SECURITY] Validate and sanitize coordinates
 */
export function sanitizeCoordinates(
  latitude: any,
  longitude: any
): { latitude: number; longitude: number } | null {
  const lat = sanitizeNumber(latitude, -90, 90);
  const lng = sanitizeNumber(longitude, -180, 180);

  if (lat === null || lng === null) {
    return null;
  }

  return { latitude: lat, longitude: lng };
}
