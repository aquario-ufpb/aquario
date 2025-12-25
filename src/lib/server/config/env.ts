/**
 * Server-side environment configuration
 *
 * This file centralizes all server-only environment variables.
 * These values are NOT exposed to the client/browser.
 *
 * For client-side config, see: src/lib/shared/config/env.ts
 */

// =============================================================================
// App
// =============================================================================

/**
 * Public URL of the app (used for email links, OAuth callbacks)
 * @default "http://localhost:3000"
 */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// =============================================================================
// Database
// =============================================================================

export const DATABASE_URL = process.env.DATABASE_URL;

// Default to memory provider if no DATABASE_URL is set, otherwise use prisma
export const DB_PROVIDER = (process.env.DB_PROVIDER || (DATABASE_URL ? "prisma" : "memory")) as
  | "prisma"
  | "memory";

// =============================================================================
// Authentication (JWT)
// =============================================================================

/**
 * JWT secret key for signing tokens
 * REQUIRED: Must be at least 32 characters
 */
export const JWT_SECRET = process.env.JWT_SECRET;

/**
 * JWT token expiration time
 * @default "7d"
 */
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Emails that automatically get MASTER_ADMIN role on registration
 */
export const MASTER_ADMIN_EMAILS = (process.env.MASTER_ADMIN_EMAILS || "")
  .split(",")
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

// =============================================================================
// Email (Resend)
// =============================================================================

/**
 * Resend API key for sending emails
 * When empty: Emails are mocked (logged to console) and users are auto-verified
 */
export const RESEND_API_KEY = process.env.RESEND_API_KEY;

/**
 * Whether email service is available (has API key)
 */
export const EMAIL_ENABLED = !!RESEND_API_KEY;

/**
 * Email sender address
 * @default "onboarding@resend.dev" (Resend test email)
 */
export const EMAIL_FROM = process.env.EMAIL_FROM
  ? `Aquário <${process.env.EMAIL_FROM}>`
  : "Aquário <onboarding@resend.dev>";

// =============================================================================
// Blob Storage
// =============================================================================

/**
 * Vercel Blob read/write token
 * When empty: Uses local file storage (development mode)
 */
export const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// =============================================================================
// Environment
// =============================================================================

export const NODE_ENV = process.env.NODE_ENV || "development";
export const IS_DEV = NODE_ENV === "development";
export const IS_PROD = NODE_ENV === "production";

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate required environment variables at startup
 * Call this in server initialization if you want early failure
 */
export function validateServerEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!JWT_SECRET) {
    errors.push("JWT_SECRET is required");
  } else if (JWT_SECRET.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters");
  }

  if (DB_PROVIDER === "prisma" && !DATABASE_URL) {
    errors.push("DATABASE_URL is required when using prisma provider");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
