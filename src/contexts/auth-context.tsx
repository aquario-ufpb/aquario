"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { usuariosService, type User } from "@/lib/client/api/usuarios";
import { tokenManager } from "@/lib/client/api/token-manager";
import { identify, reset as resetPostHog } from "@/analytics/posthog-client";

type AuthContextType = {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    tokenManager.clear();
    resetPostHog(); // Reset PostHog on logout
    window.location.href = "/login";
  }, []);

  // Handle token refresh callback
  const handleTokenRefresh = useCallback((newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    tokenManager.setToken(newToken);
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      tokenManager.setToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Set refresh callback in token manager (separate effect to avoid dependency issues)
  useEffect(() => {
    tokenManager.setRefreshCallback(handleTokenRefresh);
  }, [handleTokenRefresh]);

  useEffect(() => {
    if (token) {
      const fetchUser = async () => {
        try {
          const userData = await usuariosService.getCurrentUser(token);
          setUser(userData);
          // Identify user in PostHog (analytics will be gated by ANALYTICS_ENABLED)
          identify(userData.id, {
            email: userData.email ?? undefined,
            name: userData.nome,
            papelPlataforma: userData.papelPlataforma,
            centroId: userData.centro.id,
            centroNome: userData.centro.nome,
            centroSigla: userData.centro.sigla,
            cursoId: userData.curso.id,
            cursoNome: userData.curso.nome,
            eVerificado: userData.eVerificado,
            permissoes: userData.permissoes,
          });
        } catch {
          logout();
        } finally {
          setIsLoading(false);
        }
      };
      fetchUser();
    } else {
      setUser(null);
      setIsLoading(false);
      // Reset PostHog when user is logged out
      resetPostHog();
    }
  }, [token, logout, handleTokenRefresh]);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    tokenManager.setToken(newToken);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        token,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
