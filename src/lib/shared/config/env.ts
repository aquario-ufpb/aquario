/**
 * Client-side environment configuration
 *
 * This file centralizes all NEXT_PUBLIC_* environment variables.
 * These values ARE exposed to the client/browser (inlined at build time).
 *
 * For server-only config, see: src/lib/server/config/env.ts
 */

// =============================================================================
// Data Providers
// =============================================================================

type DataProvider = "backend" | "local";

const GUIAS_DATA_PROVIDER =
  (process.env.NEXT_PUBLIC_GUIAS_DATA_PROVIDER as DataProvider) || "backend";

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
 * Whether PostHog verbose mode is enabled (for debugging)
 */
export const POSTHOG_VERBOSE = process.env.NEXT_PUBLIC_POSTHOG_VERBOSE === "true";

// =============================================================================
// Environment
// =============================================================================

export const IS_DEV = process.env.NODE_ENV === "development";
export const IS_PROD = process.env.NODE_ENV === "production";
