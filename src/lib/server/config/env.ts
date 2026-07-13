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
// Environment
// =============================================================================

export const NODE_ENV = process.env.NODE_ENV || "development";
export const IS_PROD = NODE_ENV === "production";

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
export const EMAIL_ENABLED = !!RESEND_API_KEY && IS_PROD;

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

/**
 * Path prefix for blob storage, based on deployment environment.
 * Isolates staging/preview uploads from production within the same blob store.
 * - Production: "" (no prefix)
 * - Staging: "staging/"
 * - Preview: "preview/"
 */
export const BLOB_PATH_PREFIX =
  process.env.NEXT_PUBLIC_IS_STAGING === "true"
    ? "staging/"
    : process.env.VERCEL_ENV === "preview"
      ? "preview/"
      : "";
