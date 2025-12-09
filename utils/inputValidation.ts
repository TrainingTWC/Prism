// Security utilities for input validation and sanitization
// Protects against XSS, injection, and other input-based attacks

/**
 * Sanitizes user input by removing potentially dangerous characters
 * @param input - The string to sanitize
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
    .slice(0, maxLength); // Limit length to prevent DoS
};

/**
 * Validates employee ID format
 * @param empId - Employee ID to validate
 * @returns true if valid, false otherwise
 */
export const validateEmpId = (empId: string): boolean => {
  if (!empId || typeof empId !== 'string') return false;
  
  // Allow alphanumeric characters only, 1-20 characters
  return /^[a-zA-Z0-9]{1,20}$/.test(empId);
};

/**
 * Validates email format
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validates store ID format
 * @param storeId - Store ID to validate
 * @returns true if valid, false otherwise
 */
export const validateStoreId = (storeId: string): boolean => {
  if (!storeId || typeof storeId !== 'string') return false;
  
  // Allow alphanumeric and common separators, 1-50 characters
  return /^[a-zA-Z0-9_-]{1,50}$/.test(storeId);
};

/**
 * Validates phone number format (Indian format)
 * @param phone - Phone number to validate
 * @returns true if valid, false otherwise
 */
export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  
  // Indian phone number: 10 digits, optional +91 prefix
  return /^(\+91)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
};

/**
 * Validates that a string contains only safe characters
 * @param input - String to validate
 * @returns true if safe, false otherwise
 */
export const isSafeString = (input: string): boolean => {
  if (!input || typeof input !== 'string') return true; // Empty is safe
  
  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(input));
};

/**
 * Sanitizes remarks/comments field
 * @param remarks - Remarks text to sanitize
 * @returns Sanitized remarks
 */
export const sanitizeRemarks = (remarks: string): string => {
  if (!remarks || typeof remarks !== 'string') return '';
  
  return remarks
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .slice(0, 5000); // Allow longer text for remarks
};

/**
 * Validates and sanitizes form data object
 * @param data - Form data object
 * @returns Sanitized data object
 */
export const sanitizeFormData = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip if value is undefined or null
    if (value === undefined || value === null) {
      sanitized[key] = value;
      continue;
    }
    
    // Sanitize string values
    if (typeof value === 'string') {
      if (key.toLowerCase().includes('remark')) {
        sanitized[key] = sanitizeRemarks(value);
      } else if (key.toLowerCase().includes('email')) {
        sanitized[key] = value.toLowerCase().trim();
      } else {
        sanitized[key] = sanitizeInput(value);
      }
    } 
    // Keep other types as-is (numbers, booleans, etc.)
    else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Validates required fields are present and non-empty
 * @param data - Data object to validate
 * @param requiredFields - Array of required field names
 * @returns Object with isValid boolean and array of missing fields
 */
export const validateRequiredFields = (
  data: Record<string, any>,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } => {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    const value = data[field];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missingFields.push(field);
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Rate limiter utility (client-side)
 * Prevents too many rapid submissions
 */
export class ClientRateLimiter {
  private attempts: number[] = [];
  private maxAttempts: number;
  private windowMs: number;
  
  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }
  
  /**
   * Check if action is allowed
   * @returns true if allowed, false if rate limited
   */
  isAllowed(): boolean {
    const now = Date.now();
    
    // Remove old attempts outside the time window
    this.attempts = this.attempts.filter(time => now - time < this.windowMs);
    
    // Check if under limit
    if (this.attempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    this.attempts.push(now);
    return true;
  }
  
  /**
   * Get time until next allowed attempt (in seconds)
   */
  getTimeUntilReset(): number {
    if (this.attempts.length === 0) return 0;
    
    const oldestAttempt = this.attempts[0];
    const resetTime = oldestAttempt + this.windowMs;
    const now = Date.now();
    
    return Math.max(0, Math.ceil((resetTime - now) / 1000));
  }
  
  /**
   * Reset the limiter
   */
  reset(): void {
    this.attempts = [];
  }
}

// Export validation error messages
export const ValidationErrors = {
  INVALID_EMAIL: 'Invalid email address format',
  INVALID_EMP_ID: 'Invalid employee ID format',
  INVALID_STORE_ID: 'Invalid store ID format',
  INVALID_PHONE: 'Invalid phone number format',
  UNSAFE_INPUT: 'Input contains potentially dangerous characters',
  REQUIRED_FIELD: 'This field is required',
  RATE_LIMIT_EXCEEDED: 'Too many attempts. Please try again later.',
  INPUT_TOO_LONG: 'Input exceeds maximum allowed length'
} as const;
