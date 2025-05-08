import * as crypto from "crypto";
import { z } from "zod";

// Strong password validation schema
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be less than 100 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>\\'`~\[\]\/\-_=+])[A-Za-z\d!@#$%^&*(),.?":{}|<>\\'`~\[\]\/\-_=+]{8,}$/,
    "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"
  );

// Generate a secure random token
export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

// Generate a secure password hash with proper salt rounds
// This function should only be called on the server
export async function hashPassword(password: string): Promise<string> {
  // Dynamic import to ensure bcrypt is only loaded on the server
  const bcrypt = (await import("bcrypt")).default;
  // Using 12 rounds for better security (higher than the default 10)
  return await bcrypt.hash(password, 12);
}

// Verify password against hash
// This function should only be called on the server
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  // Dynamic import to ensure bcrypt is only loaded on the server
  const bcrypt = (await import("bcrypt")).default;
  return await bcrypt.compare(password, hash);
}

// Generate a secure password reset token with expiration
export function generatePasswordResetToken(): { token: string; expires: Date } {
  const token = generateSecureToken(40); // Longer token for better security
  // Token expires in 1 hour
  const expires = new Date(Date.now() + 1000 * 60 * 60);

  return { token, expires };
}

// Validate CSRF token
export function validateCsrfToken(token: string, storedToken: string): boolean {
  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(storedToken));
}

// Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
  // Basic sanitization - in production, consider using a library like DOMPurify
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Log security events
export function logSecurityEvent(
  event: string,
  details: Record<string, any>
): void {
  // In production, you would want to send this to a secure logging service
  console.log(`SECURITY EVENT: ${event}`, {
    timestamp: new Date().toISOString(),
    ...details,
  });
}
