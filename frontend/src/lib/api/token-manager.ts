/**
 * Global token manager
 * Stores the current token and refresh callback
 * This allows the API client to automatically use them without passing explicitly
 */
class TokenManager {
  private token: string | null = null;
  private onTokenRefresh: ((token: string) => void) | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  setRefreshCallback(callback: ((token: string) => void) | null) {
    this.onTokenRefresh = callback;
  }

  getRefreshCallback(): ((token: string) => void) | null {
    return this.onTokenRefresh;
  }

  clear() {
    this.token = null;
    this.onTokenRefresh = null;
  }
}

export const tokenManager = new TokenManager();
