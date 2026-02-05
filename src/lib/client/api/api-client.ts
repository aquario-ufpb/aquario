import { API_URL, ENDPOINTS } from "@/lib/shared/config/constants";
import { tokenManager } from "./token-manager";

/**
 * Global state for token refresh
 * Prevents multiple simultaneous refresh requests
 */
let refreshPromise: Promise<string> | null = null;
let refreshCallbacks: Array<{ resolve: (token: string) => void; reject: (error: Error) => void }> =
  [];

/**
 * Refresh the authentication token
 */
function refreshToken(currentToken: string): Promise<string> {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    return new Promise((resolve, reject) => {
      refreshCallbacks.push({ resolve, reject });
    });
  }

  // Start new refresh
  refreshPromise = (async (): Promise<string> => {
    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.REFRESH}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Falha ao renovar token");
      }

      const data = await response.json();
      const newToken = data.token;

      // Resolve all waiting callbacks
      refreshCallbacks.forEach(({ resolve }) => resolve(newToken));
      refreshCallbacks = [];
      refreshPromise = null;

      return newToken;
    } catch (error) {
      // Reject all waiting callbacks
      const err = error instanceof Error ? error : new Error("Erro desconhecido ao renovar token");
      refreshCallbacks.forEach(({ reject }) => reject(err));
      refreshCallbacks = [];
      refreshPromise = null;
      throw err;
    }
  })();

  return refreshPromise;
}

/**
 * API client with automatic token refresh on 401 errors
 * Automatically uses token and refresh callback from tokenManager
 * You can still override by passing token/onTokenRefresh explicitly
 *
 * @param endpoint - The API endpoint (e.g., "/usuarios/me"). API_URL is prepended automatically.
 */
export async function apiClient(
  endpoint: string,
  options: RequestInit & { token?: string | null; onTokenRefresh?: (token: string) => void } = {}
): Promise<Response> {
  // Use token from options, or fall back to tokenManager, or null
  const token = options.token ?? tokenManager.getToken();
  const onTokenRefresh = options.onTokenRefresh ?? tokenManager.getRefreshCallback();
  const { token: _, onTokenRefresh: __, ...fetchOptions } = options;

  const url = `${API_URL}${endpoint}`;

  // Make initial request
  let response = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...fetchOptions.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  // If we get a 401 and have a token, try to refresh
  if (response.status === 401 && token) {
    try {
      const newToken = await refreshToken(token);

      // Notify about token refresh
      if (onTokenRefresh) {
        onTokenRefresh(newToken);
      }

      // Retry original request with new token
      response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    } catch (refreshError) {
      console.error("Refresh token failed:", refreshError);
      // Refresh failed, return original 401 response
      // The caller should handle logout
      return response;
    }
  }

  return response;
}
