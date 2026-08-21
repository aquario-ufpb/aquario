"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usuariosService, type User } from "@/lib/client/api/usuarios";
import { tokenManager } from "@/lib/client/api/token-manager";
import { privateQueryKeys, queryKeys } from "@/lib/client/query-keys";
import { identify, reset as resetPostHog } from "@/analytics/posthog-client";

type AuthContextType = {
  isAuthenticated: boolean;
  userId: string | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
};

type SessionGeneration = number;

type ActiveSession = {
  generation: SessionGeneration;
  token: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const activeUserIdRef = useRef<string | null>(null);
  const sessionGenerationRef = useRef<SessionGeneration>(0);
  const activeSessionRef = useRef<ActiveSession | null>(null);

  const clearPrivateQueries = useCallback(() => {
    void queryClient.cancelQueries({ queryKey: privateQueryKeys.all });
    queryClient.removeQueries({ queryKey: privateQueryKeys.all });
  }, [queryClient]);

  const logout = useCallback(() => {
    sessionGenerationRef.current += 1;
    activeSessionRef.current = null;
    clearPrivateQueries();
    activeUserIdRef.current = null;
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    tokenManager.clear();
    resetPostHog(); // Reset PostHog on logout
    window.location.href = "/login";
  }, [clearPrivateQueries]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      activeSessionRef.current = {
        generation: sessionGenerationRef.current,
        token: storedToken,
      };
      setToken(storedToken);
      tokenManager.setToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const callbackGeneration = sessionGenerationRef.current;
    const handleTokenRefresh = (refreshedToken: string, sourceToken: string) => {
      const activeSession = activeSessionRef.current;
      if (
        !activeSession ||
        activeSession.generation !== callbackGeneration ||
        activeSession.token !== sourceToken
      ) {
        return;
      }

      sessionGenerationRef.current += 1;
      activeSessionRef.current = {
        generation: sessionGenerationRef.current,
        token: refreshedToken,
      };
      localStorage.setItem("token", refreshedToken);
      setToken(refreshedToken);
      tokenManager.setToken(refreshedToken);
    };

    tokenManager.setRefreshCallback(handleTokenRefresh);
    return () => {
      if (tokenManager.getRefreshCallback() === handleTokenRefresh) {
        tokenManager.setRefreshCallback(null);
      }
    };
  }, [token]);

  useEffect(() => {
    if (token) {
      const generation = sessionGenerationRef.current;
      const fetchUser = async () => {
        try {
          const userData = await usuariosService.getCurrentUser(token);
          if (sessionGenerationRef.current !== generation) {
            return;
          }
          if (activeUserIdRef.current && activeUserIdRef.current !== userData.id) {
            clearPrivateQueries();
          }
          activeUserIdRef.current = userData.id;
          queryClient.setQueryData(queryKeys.usuarios.current(userData.id), userData);
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
          if (sessionGenerationRef.current === generation) {
            logout();
          }
        } finally {
          if (sessionGenerationRef.current === generation) {
            setIsLoading(false);
          }
        }
      };
      fetchUser();
    } else {
      setUser(null);
      setIsLoading(false);
      // Reset PostHog when user is logged out
      resetPostHog();
    }
  }, [token, logout, clearPrivateQueries, queryClient]);

  const login = (newToken: string) => {
    sessionGenerationRef.current += 1;
    activeSessionRef.current = {
      generation: sessionGenerationRef.current,
      token: newToken,
    };
    clearPrivateQueries();
    activeUserIdRef.current = null;
    setUser(null);
    setIsLoading(true);
    localStorage.setItem("token", newToken);
    setToken(newToken);
    tokenManager.setToken(newToken);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        userId: user?.id ?? null,
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
