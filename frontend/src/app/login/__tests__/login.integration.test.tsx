/**
 * Integration tests for Login page
 * Tests login flow, error handling, and navigation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, useSearchParams } from "next/navigation";
import Login from "../page";
import * as authService from "../../../lib/api/auth";
import { AuthProvider } from "../../../contexts/auth-context";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock useBackend to return true for these tests
vi.mock("../../../lib/config/env", async importOriginal => {
  const actual = await importOriginal<typeof import("../../../lib/config/env")>();
  return {
    ...actual,
    useBackend: () => ({ isEnabled: true }),
  };
});

// Mock auth service
vi.mock("../../../lib/api/auth", () => ({
  authService: {
    login: vi.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuthService = authService as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRouter = useRouter as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSearchParams = useSearchParams as any;

describe("Login Page", () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();
  const mockGet = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    mockGet.mockReturnValue(null);
    mockSearchParams.mockReturnValue({
      get: mockGet,
    });
  });

  const renderLogin = async () => {
    const result = render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );
    // Wait for Suspense to resolve and form to be ready
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
    return result;
  };

  it("should render login form", async () => {
    await renderLogin();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("should show error on failed login", async () => {
    mockAuthService.authService.login.mockRejectedValue(new Error("E-mail ou senha inválidos."));

    await renderLogin();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole("button", { name: /entrar/i });

    await userEvent.type(emailInput, "test@academico.ufpb.br");
    await userEvent.type(passwordInput, "wrongpassword");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/e-mail ou senha inválidos/i)).toBeInTheDocument();
    });
  });

  it("should redirect to home on successful login", async () => {
    mockAuthService.authService.login.mockResolvedValue({ token: "test-token" });

    await renderLogin();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole("button", { name: /entrar/i });

    await userEvent.type(emailInput, "test@academico.ufpb.br");
    await userEvent.type(passwordInput, "password123");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("should show link to forgot password", async () => {
    await renderLogin();

    expect(screen.getByText(/esqueci minha senha/i)).toBeInTheDocument();
  });

  it("should show link to registration", async () => {
    await renderLogin();

    expect(screen.getByText(/criar conta/i)).toBeInTheDocument();
  });
});
