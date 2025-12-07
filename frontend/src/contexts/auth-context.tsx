"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { usuariosService, type User } from "@/lib/api/usuarios";
import { tokenManager } from "@/lib/api/token-manager";

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
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
        } catch (error) {
          console.error("Falha ao buscar usuário:", error);
          logout();
        } finally {
          setIsLoading(false);
        }
      };
      fetchUser();
    } else {
      setUser(null);
      setIsLoading(false);
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
        user,
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
