/**
 * Client-side environment configuration
 *
 * This file centralizes all NEXT_PUBLIC_* environment variables.
 * These values ARE exposed to the client/browser (inlined at build time).
 *
 * For server-only config, see: src/lib/server/config/env.ts
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
// Data Providers
// =============================================================================

type DataProvider = "backend" | "local";

/**
 * Guias data provider configuration
 * Can use "backend" (API) or "local" (submodules)
 */
export const GUIAS_DATA_PROVIDER =
  (process.env.NEXT_PUBLIC_GUIAS_DATA_PROVIDER as DataProvider) || "backend";

// Legacy export for backward compatibility
export const GUIDAS_DATA_PROVIDER_CONFIG = {
  PROVIDER: GUIAS_DATA_PROVIDER,
  PROVIDERS: {
    BACKEND: "backend",
    LOCAL: "local",
  },
} as const;

// =============================================================================
// Analytics (PostHog)
// =============================================================================

/**
 * PostHog project API key
 * When empty: Analytics disabled entirely
 */
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";

/**
 * PostHog host URL
 * @default "https://us.i.posthog.com"
 */
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

/**
 * Whether PostHog verbose mode is enabled (for debugging)
 */
export const POSTHOG_VERBOSE = process.env.NEXT_PUBLIC_POSTHOG_VERBOSE === "true";

/**
 * Whether analytics is enabled
 * Only enabled in production with a valid key
 */
export const ANALYTICS_ENABLED = !!POSTHOG_KEY && process.env.NODE_ENV === "production";

// =============================================================================
// Environment
// =============================================================================

export const IS_DEV = process.env.NODE_ENV === "development";
export const IS_PROD = process.env.NODE_ENV === "production";
