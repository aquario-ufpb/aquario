/**
 * Integration tests for AuthContext
 * Tests authentication state management, token handling, and user fetching
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../auth-context";
import { queryKeys } from "@/lib/client/query-keys";
import { tokenManager } from "@/lib/client/api/token-manager";
import React from "react";

// Mock the usuarios service
vi.mock("@/lib/client/api/usuarios", () => ({
  usuariosService: {
    getCurrentUser: vi.fn(),
  },
}));

// Import after mocking
import { usuariosService } from "@/lib/client/api/usuarios";

const mockGetCurrentUser = vi.mocked(usuariosService.getCurrentUser);

const mockUser = {
  id: "user-1",
  nome: "Test User",
  email: "test@academico.ufpb.br",
  papelPlataforma: "USER" as const,
  eVerificado: true,
  urlFotoPerfil: null,
  centro: {
    id: "centro-1",
    nome: "Centro de Informática",
    sigla: "CI",
  },
  curso: {
    id: "curso-1",
    nome: "Ciência da Computação",
  },
  permissoes: [],
};

const secondMockUser = {
  ...mockUser,
  id: "user-2",
  nome: "Second User",
  email: "second@academico.ufpb.br",
};

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );

    return { queryClient, wrapper };
  };

  it("should initialize with no user when no token in localStorage", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userId).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it("should fetch user when token exists in localStorage", async () => {
    localStorage.setItem("token", "test-token");
    mockGetCurrentUser.mockResolvedValue(mockUser);

    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userId).toBe(mockUser.id);
    expect(result.current.token).toBe("test-token");
    expect(mockGetCurrentUser).toHaveBeenCalledWith("test-token");
    expect(queryClient.getQueryData(queryKeys.usuarios.current(mockUser.id))).toEqual(mockUser);
  });

  it("should logout and clear user when token is invalid", async () => {
    localStorage.setItem("token", "invalid-token");
    mockGetCurrentUser.mockRejectedValue(new Error("Unauthorized"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("should login and set token", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockGetCurrentUser.mockResolvedValue(mockUser);

    result.current.login("new-token");

    await waitFor(() => {
      expect(result.current.token).toBe("new-token");
    });

    expect(localStorage.getItem("token")).toBe("new-token");
    expect(mockGetCurrentUser).toHaveBeenCalledWith("new-token");
  });

  it("removes private queries when the authenticated identity changes", async () => {
    localStorage.setItem("token", "user-1-token");
    mockGetCurrentUser.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(secondMockUser);
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.userId).toBe(mockUser.id);
    });

    queryClient.setQueryData(queryKeys.disciplinasConcluidas.me(mockUser.id), ["cached"]);

    act(() => {
      result.current.login("user-2-token");
    });

    expect(
      queryClient.getQueryData(queryKeys.disciplinasConcluidas.me(mockUser.id))
    ).toBeUndefined();

    await waitFor(() => {
      expect(result.current.userId).toBe(secondMockUser.id);
    });

    expect(queryClient.getQueryData(queryKeys.usuarios.current(mockUser.id))).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.usuarios.current(secondMockUser.id))).toEqual(
      secondMockUser
    );
  });

  it("ignores stale auth success and finally after a newer login", async () => {
    localStorage.setItem("token", "user-1-token");
    const firstUser = createDeferred<typeof mockUser>();
    const secondUser = createDeferred<typeof secondMockUser>();
    mockGetCurrentUser
      .mockReturnValueOnce(firstUser.promise)
      .mockReturnValueOnce(secondUser.promise);
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(mockGetCurrentUser).toHaveBeenCalledWith("user-1-token");
    });

    act(() => {
      result.current.login("user-2-token");
    });

    await waitFor(() => {
      expect(mockGetCurrentUser).toHaveBeenCalledWith("user-2-token");
    });

    await act(async () => {
      firstUser.resolve(mockUser);
      await firstUser.promise;
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.userId).toBeNull();
    expect(queryClient.getQueryData(queryKeys.usuarios.current(mockUser.id))).toBeUndefined();

    await act(async () => {
      secondUser.resolve(secondMockUser);
      await secondUser.promise;
    });

    await waitFor(() => {
      expect(result.current.userId).toBe(secondMockUser.id);
    });
  });

  it("ignores stale auth failure after a newer login succeeds", async () => {
    localStorage.setItem("token", "user-1-token");
    const firstUser = createDeferred<typeof mockUser>();
    mockGetCurrentUser.mockReturnValueOnce(firstUser.promise).mockResolvedValueOnce(secondMockUser);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(mockGetCurrentUser).toHaveBeenCalledWith("user-1-token");
    });

    act(() => {
      result.current.login("user-2-token");
    });

    await waitFor(() => {
      expect(result.current.userId).toBe(secondMockUser.id);
    });

    await act(async () => {
      firstUser.reject(new Error("stale unauthorized"));
      await firstUser.promise.catch(() => undefined);
    });

    expect(result.current.userId).toBe(secondMockUser.id);
    expect(result.current.token).toBe("user-2-token");
    expect(localStorage.getItem("token")).toBe("user-2-token");
  });

  it("ignores an auth failure from before a valid token refresh", async () => {
    localStorage.setItem("token", "old-token");
    const oldRequest = createDeferred<typeof mockUser>();
    mockGetCurrentUser.mockReturnValueOnce(oldRequest.promise).mockResolvedValueOnce(mockUser);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(mockGetCurrentUser).toHaveBeenCalledWith("old-token");
    });

    act(() => {
      tokenManager.getRefreshCallback()?.("refreshed-token", "old-token");
    });

    await waitFor(() => {
      expect(result.current.token).toBe("refreshed-token");
      expect(result.current.userId).toBe(mockUser.id);
    });

    await act(async () => {
      oldRequest.reject(new Error("stale unauthorized"));
      await oldRequest.promise.catch(() => undefined);
    });

    expect(result.current.userId).toBe(mockUser.id);
    expect(result.current.token).toBe("refreshed-token");
    expect(localStorage.getItem("token")).toBe("refreshed-token");
  });

  it("should logout and clear all state", async () => {
    localStorage.setItem("token", "test-token");
    mockGetCurrentUser.mockResolvedValue(mockUser);

    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    queryClient.setQueryData(queryKeys.usuarios.onboarding(mockUser.id), { cached: true });

    // Mock window.location.href setter
    const mockLocationHref = vi.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).location = {
      href: "",
    };
    Object.defineProperty(window.location, "href", {
      set: mockLocationHref,
      get: () => "",
      configurable: true,
    });

    result.current.logout();

    // Wait for state to update asynchronously
    await waitFor(() => {
      expect(result.current.token).toBeNull();
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });

    expect(localStorage.getItem("token")).toBeNull();
    expect(queryClient.getQueryData(queryKeys.usuarios.onboarding(mockUser.id))).toBeUndefined();
  });
});
