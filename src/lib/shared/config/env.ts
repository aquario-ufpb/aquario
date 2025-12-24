/**
 * Centralized environment configuration
 *
 * The backend is now integrated into the Next.js app as API routes.
 * Data providers can still switch between backend (API routes) and local files.
 */

/**
 * USE_BACKEND controls whether backend features (auth, database) are enabled.
 * When false, the app runs in "local mode" with data from git submodules.
 */
export const USE_BACKEND = process.env.NEXT_PUBLIC_USE_BACKEND === "true";

/**
 * Database provider: "prisma" (real DB) or "memory" (in-memory for testing)
 * Automatically uses "memory" when USE_BACKEND is false.
 */
export const DB_PROVIDER = USE_BACKEND ? process.env.DB_PROVIDER || "prisma" : "memory";

// Data Provider Configuration
// Determines whether to fetch data from API routes (backend) or local files
// When USE_BACKEND is false, always use local providers
const getProvider = (envVar: string | undefined): string => {
  if (!USE_BACKEND) {
    return "local";
  }
  return envVar || "backend";
};

export const GUIDAS_DATA_PROVIDER_CONFIG = {
  PROVIDER: getProvider(process.env.NEXT_PUBLIC_GUIAS_DATA_PROVIDER),
  PROVIDERS: {
    BACKEND: "backend",
    LOCAL: "local",
  },
} as const;

export const ENTIDADES_DATA_PROVIDER_CONFIG = {
  PROVIDER: getProvider(process.env.NEXT_PUBLIC_ENTIDADES_DATA_PROVIDER),
  PROVIDERS: {
    BACKEND: "backend",
    LOCAL: "local",
  },
} as const;

/**
 * Check if the app is running with database enabled
 * When DB_PROVIDER is "memory", we're running without a real database
 */
export function useDatabase() {
  return {
    isEnabled: DB_PROVIDER === "prisma",
    provider: DB_PROVIDER,
  };
}

/**
 * Check if backend features are enabled
 * Since the backend is now integrated into Next.js API routes,
 * this always returns true when using the real database.
 *
 * Use USE_BACKEND === "true" to check if using real backend or local files.
 */
export function useBackend() {
  return {
    isEnabled: USE_BACKEND,
  };
}
