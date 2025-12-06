/**
 * Integration tests for AuthContext
 * Tests authentication state management, token handling, and user fetching
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../auth-context";
import * as usuariosService from "../../lib/api/usuarios";
import React from "react";

// Mock the usuarios service
vi.mock("../../lib/api/usuarios");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUsuariosService = usuariosService as any;

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

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUsuariosService.usuariosService = {
      getCurrentUser: vi.fn(),
    };
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it("should initialize with no user when no token in localStorage", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it("should fetch user when token exists in localStorage", async () => {
    localStorage.setItem("token", "test-token");
    mockUsuariosService.usuariosService.getCurrentUser.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe("test-token");
    expect(mockUsuariosService.usuariosService.getCurrentUser).toHaveBeenCalledWith("test-token");
  });

  it("should logout and clear user when token is invalid", async () => {
    localStorage.setItem("token", "invalid-token");
    mockUsuariosService.usuariosService.getCurrentUser.mockRejectedValue(new Error("Unauthorized"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("should login and set token", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockUsuariosService.usuariosService.getCurrentUser.mockResolvedValue(mockUser);

    result.current.login("new-token");

    await waitFor(() => {
      expect(result.current.token).toBe("new-token");
    });

    expect(localStorage.getItem("token")).toBe("new-token");
    expect(mockUsuariosService.usuariosService.getCurrentUser).toHaveBeenCalledWith("new-token");
  });

  it("should logout and clear all state", async () => {
    localStorage.setItem("token", "test-token");
    mockUsuariosService.usuariosService.getCurrentUser.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

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
      expect(result.current.user).toBeNull();
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });

    expect(localStorage.getItem("token")).toBeNull();
  });
});
