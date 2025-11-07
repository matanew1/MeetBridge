// utils/inputSanitizer.ts
// [SECURITY] Input sanitization and validation utilities

/**
 * [SECURITY] Sanitize string inputs to prevent injection attacks
 */
export function sanitizeString(
  input: string,
  maxLength: number = 1000
): string {
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
 * [SECURITY] Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }

  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return emailRegex.test(sanitized) ? sanitized : '';
}

/**
 * [SECURITY] Validate and sanitize user IDs (alphanumeric only)
 */
export function sanitizeUserId(userId: string): string {
  if (typeof userId !== 'string') {
    return '';
  }

  // Allow only alphanumeric characters and hyphens
  return userId.replace(/[^a-zA-Z0-9-]/g, '').substring(0, 100);
}

/**
 * [SECURITY] Validate and sanitize numeric values
 */
export function sanitizeNumber(
  value: any,
  min?: number,
  max?: number
): number | null {
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
 * [SECURITY] Validate coordinates (latitude/longitude)
 */
export function sanitizeCoordinates(
  lat: number,
  lon: number
): { latitude: number; longitude: number } | null {
  const latitude = sanitizeNumber(lat, -90, 90);
  const longitude = sanitizeNumber(lon, -180, 180);

  if (latitude === null || longitude === null) {
    return null;
  }

  return { latitude, longitude };
}

/**
 * [SECURITY] Sanitize URL to prevent XSS and protocol smuggling
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }

  const sanitized = url.trim();

  // Only allow http and https protocols
  if (!sanitized.startsWith('http://') && !sanitized.startsWith('https://')) {
    return '';
  }

  // Remove javascript: and data: protocols
  if (
    sanitized.match(/javascript:/i) ||
    sanitized.match(/data:/i) ||
    sanitized.match(/vbscript:/i)
  ) {
    return '';
  }

  return sanitized;
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
 * [SECURITY] Validate Firebase document ID
 */
export function sanitizeDocumentId(docId: string): string {
  if (typeof docId !== 'string') {
    return '';
  }

  // Firebase document IDs: alphanumeric, underscore, hyphen
  return docId.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 100);
}

/**
 * [SECURITY] Sanitize search query to prevent injection
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== 'string') {
    return '';
  }

  return query
    .trim()
    .replace(/[<>(){}[\]]/g, '') // Remove operators
    .replace(/[;'"`]/g, '') // Remove quotes and semicolons
    .substring(0, 100);
}

/**
 * [SECURITY] Validate enum value against allowed values
 */
export function sanitizeEnum<T extends string>(
  value: any,
  allowedValues: readonly T[]
): T | null {
  if (typeof value !== 'string') {
    return null;
  }

  return (allowedValues as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

/**
 * [SECURITY] Validate and sanitize phone number
 */
export function sanitizePhoneNumber(phone: string): string {
  if (typeof phone !== 'string') {
    return '';
  }

  // Remove all non-numeric characters except + at the start
  const sanitized = phone.replace(/[^\d+]/g, '');

  // Validate format: optional + followed by digits
  const phoneRegex = /^\+?\d{7,15}$/;

  return phoneRegex.test(sanitized) ? sanitized : '';
}

/**
 * [SECURITY] Validate boolean value
 */
export function sanitizeBoolean(value: any): boolean {
  return value === true || value === 'true';
}
