/**
 * Centralized environment configuration
 *
 * The backend is now integrated into the Next.js app as API routes.
 * Data providers can still switch between backend (API routes) and local files.
 */

// Database provider: "prisma" (default) or "memory" (for testing without DB)
export const DB_PROVIDER = process.env.DB_PROVIDER || "prisma";

/**
 * Use USE_BACKEND === "true" to check if using real backend or local files.
 */
export const USE_BACKEND = process.env.USE_BACKEND === "true";

// Data Provider Configuration
// Determines whether to fetch data from API routes (backend) or local files
const getProvider = (envVar: string | undefined, defaultProvider: string): string => {
  return envVar || defaultProvider;
};

export const GUIDAS_DATA_PROVIDER_CONFIG = {
  PROVIDER: getProvider(process.env.NEXT_PUBLIC_GUIAS_DATA_PROVIDER, "backend"),
  PROVIDERS: {
    BACKEND: "backend",
    LOCAL: "local",
  },
} as const;

export const ENTIDADES_DATA_PROVIDER_CONFIG = {
  PROVIDER: getProvider(process.env.NEXT_PUBLIC_ENTIDADES_DATA_PROVIDER, "backend"),
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
