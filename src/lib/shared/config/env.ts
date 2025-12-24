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

/**
 * Whether backend features (auth, database) are enabled
 * When false, the app runs in "local mode" with data from git submodules
 */
export const USE_BACKEND = process.env.NEXT_PUBLIC_USE_BACKEND === "true";

// =============================================================================
// Data Providers
// =============================================================================

type DataProvider = "backend" | "local";

/**
 * Get the data provider, respecting USE_BACKEND setting
 * When USE_BACKEND is false, always use local providers
 */
function getProvider(envVar: string | undefined): DataProvider {
  if (!USE_BACKEND) {
    return "local";
  }
  return (envVar as DataProvider) || "backend";
}

export const GUIAS_DATA_PROVIDER = getProvider(process.env.NEXT_PUBLIC_GUIAS_DATA_PROVIDER);
export const ENTIDADES_DATA_PROVIDER = getProvider(process.env.NEXT_PUBLIC_ENTIDADES_DATA_PROVIDER);

// Legacy exports for backward compatibility
export const GUIDAS_DATA_PROVIDER_CONFIG = {
  PROVIDER: GUIAS_DATA_PROVIDER,
  PROVIDERS: {
    BACKEND: "backend",
    LOCAL: "local",
  },
} as const;

export const ENTIDADES_DATA_PROVIDER_CONFIG = {
  PROVIDER: ENTIDADES_DATA_PROVIDER,
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

// =============================================================================
// Helper functions
// =============================================================================

/**
 * Check if the app is running with database enabled
 * Note: This is a client-side check based on USE_BACKEND
 */
export function useDatabase() {
  return {
    isEnabled: USE_BACKEND,
  };
}

/**
 * Check if backend features are enabled
 */
export function useBackend() {
  return {
    isEnabled: USE_BACKEND,
  };
}
