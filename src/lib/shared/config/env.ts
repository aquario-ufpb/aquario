/**
 * Centralized environment configuration
 *
 * The backend is now integrated into the Next.js app as API routes.
 * Data providers can still switch between backend (API routes) and local files.
 */

// Database provider: "prisma" (default) or "memory" (for testing without DB)
export const DB_PROVIDER = process.env.DB_PROVIDER || "prisma";

/**
 * @deprecated Backend is now always available in the monorepo.
 * Use DB_PROVIDER === "prisma" to check if using real database.
 */
export const USE_BACKEND = DB_PROVIDER === "prisma";

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
 * @deprecated The backend is now always available. Use useDatabase() to check if DB is enabled.
 */
export function useBackend() {
  return {
    isEnabled: DB_PROVIDER === "prisma",
  };
}
