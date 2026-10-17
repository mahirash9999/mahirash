/**
 * Centralized Validation & Sanitization Utilities for Mahirash Parfumerie
 * Protects client forms against malformed inputs, oversized payloads, and injection attempts.
 */

// 1. Phone number: Strictly 10 digits Indian mobile number starting with 6, 7, 8, or 9
export const cleanPhone = (val) => {
  if (!val) return "";
  return String(val).replace(/\D/g, "").slice(0, 10);
};

export const isValidPhone = (val) => {
  const cleaned = cleanPhone(val);
  return /^[6-9]\d{9}$/.test(cleaned);
};

// 2. PIN code: Exactly 6 digits
export const cleanPincode = (val) => {
  if (!val) return "";
  return String(val).replace(/\D/g, "").slice(0, 6);
};

export const isValidPincode = (val) => {
  const cleaned = cleanPincode(val);
  return /^\d{6}$/.test(cleaned);
};

// 3. Email: Standard RFC-compliant email regex
export const isValidEmail = (val) => {
  if (!val) return false;
  const clean = String(val).trim().toLowerCase();
  if (clean.length < 5 || clean.length > 100) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(clean);
};

// 4. Full Name: Letters, spaces, apostrophes, and hyphens (2 to 60 characters)
export const isValidName = (val) => {
  if (!val) return false;
  const clean = String(val).trim();
  if (clean.length < 2 || clean.length > 60) return false;
  return /^[a-zA-Z\s.'-]+$/.test(clean);
};

// 5. Text Sanitizer: Strips potential HTML / script tags and dangerous characters
export const sanitizeText = (val, maxLength = 500) => {
  if (!val) return "";
  return String(val)
    .replace(/<[^>]*>?/gm, "") // Strip HTML tags
    .replace(/[<>'"`;]/g, "")   // Remove script-injection characters
    .trim()
    .slice(0, maxLength);
};

// 6. Safe String for messages (allows basic punctuation like commas, periods, exclamation marks)
export const sanitizeMessage = (val, maxLength = 1000) => {
  if (!val) return "";
  return String(val)
    .replace(/<[^>]*>?/gm, "") // Strip HTML tags
    .replace(/[<>{}[\]\\]/g, "") // Remove potential code injection symbols
    .trim()
    .slice(0, maxLength);
};
