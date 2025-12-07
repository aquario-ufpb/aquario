/**
 * Centralized environment configuration
 */

// Backend Usage Flag
// If false, all providers are forced to local and auth features are disabled
export const USE_BACKEND = process.env.NEXT_PUBLIC_USE_BACKEND !== "false";

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
} as const;

// Data Provider Configuration
// If USE_BACKEND is false, force all providers to LOCAL
const getProvider = (envVar: string | undefined, defaultProvider: string): string => {
  if (!USE_BACKEND) {
    return "local";
  }
  return envVar || defaultProvider;
};

console.log("NEXT_PUBLIC_USE_BACKEND:", USE_BACKEND);
console.log("NEXT_PUBLIC_GUIAS_DATA_PROVIDER:", process.env.NEXT_PUBLIC_GUIAS_DATA_PROVIDER);
export const GUIDAS_DATA_PROVIDER_CONFIG = {
  PROVIDER: getProvider(process.env.NEXT_PUBLIC_GUIAS_DATA_PROVIDER, "local"),
  PROVIDERS: {
    BACKEND: "backend",
    LOCAL: "local",
  },
} as const;

export const ENTIDADES_DATA_PROVIDER_CONFIG = {
  PROVIDER: getProvider(process.env.NEXT_PUBLIC_ENTIDADES_DATA_PROVIDER, "local"),
  PROVIDERS: {
    BACKEND: "backend",
    LOCAL: "local",
  },
} as const;

/**
 * Hook for React components to check if backend is enabled
 * When NEXT_PUBLIC_USE_BACKEND is false, backend features are disabled
 */
export function useBackend() {
  return {
    isEnabled: USE_BACKEND,
  };
}
