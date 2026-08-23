/**
 * Integration tests for Login page
 * Tests login flow, error handling, and navigation
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Login from "../page";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { queryKeys } from "@/lib/client/query-keys";
import type { OnboardingMetadata } from "@/lib/shared/types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock useBackend to return true for these tests
vi.mock("@/lib/shared/config/env", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/shared/config/env")>();
  return {
    ...actual,
    useBackend: () => ({ isEnabled: true }),
  };
});

// Mock auth service
vi.mock("@/lib/client/api/auth", () => ({
  authService: {
    login: vi.fn(),
  },
}));

vi.mock("@/lib/client/api/usuarios", () => ({
  usuariosService: {
    getCurrentUser: vi.fn(),
    getOnboardingMetadata: vi.fn(),
    updateOnboardingMetadata: vi.fn(),
  },
}));

vi.mock("@/lib/client/api/calendario-academico", () => ({
  calendarioAcademicoService: {
    getSemestreAtivo: vi.fn(),
  },
}));

vi.mock("@/lib/client/api", () => ({
  paasService: {
    getCenter: vi.fn(),
  },
}));

vi.mock("@/components/onboarding/onboarding-modal", () => ({
  OnboardingModal: () => <div role="dialog" aria-label="Configuração inicial" />,
}));

// Import after mocking
import { authService } from "@/lib/client/api/auth";
import { usuariosService } from "@/lib/client/api/usuarios";
import { calendarioAcademicoService } from "@/lib/client/api/calendario-academico";
import { paasService } from "@/lib/client/api";

const mockLogin = vi.mocked(authService.login);
const mockGetCurrentUser = vi.mocked(usuariosService.getCurrentUser);
const mockGetOnboardingMetadata = vi.mocked(usuariosService.getOnboardingMetadata);
const mockGetSemestreAtivo = vi.mocked(calendarioAcademicoService.getSemestreAtivo);
const mockGetPaasCenter = vi.mocked(paasService.getCenter);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRouter = useRouter as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSearchParams = useSearchParams as any;
const mockUsePathname = vi.mocked(usePathname);

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function SessionSwitchHarness() {
  const { login } = useAuth();
  return <button onClick={() => login("fresh-token")}>Switch session</button>;
}

describe("Login Page", () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();
  const mockGet = vi.fn();
  let currentPathname = "/login";
  const authenticatedUser = {
    id: "user-1",
    nome: "Test User",
    email: "test@academico.ufpb.br",
    papelPlataforma: "USER" as const,
    eVerificado: true,
    urlFotoPerfil: null,
    centro: { id: "centro-1", nome: "Centro de Informática", sigla: "CI" },
    curso: { id: "curso-1", nome: "Ciência da Computação" },
    permissoes: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetCurrentUser.mockResolvedValue(authenticatedUser);
    mockGetOnboardingMetadata.mockResolvedValue({});
    mockGetSemestreAtivo.mockResolvedValue({
      id: "semester-1",
      nome: "2026.2",
      dataInicio: "2000-01-01T00:00:00.000Z",
      dataFim: "2100-12-31T23:59:59.999Z",
      criadoEm: "2026-01-01T00:00:00.000Z",
      atualizadoEm: "2026-01-01T00:00:00.000Z",
    });
    mockGetPaasCenter.mockResolvedValue({
      id: 1,
      centro: "Centro de Informática",
      date: "2026-08-23",
      description: "2026.2",
      hash: "test",
      status: "ready",
      userId: null,
      sigla: "CI",
      paasPublicSolutions: [],
      solution: {
        id: 1,
        status: "ready",
        error: "",
        paasPlanId: null,
        date: "2026-08-23",
        solution: [],
      },
    });
    currentPathname = "/login";
    mockUsePathname.mockImplementation(() => currentPathname);
    mockRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    mockGet.mockReturnValue(null);
    mockSearchParams.mockReturnValue({
      get: mockGet,
    });
  });

  const renderLogin = async ({ waitForForm = true }: { waitForForm?: boolean } = {}) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const result = render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </QueryClientProvider>
    );
    if (waitForForm) {
      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });
    }
    return result;
  };

  it("should render login form", async () => {
    await renderLogin();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/sua senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("should show error on failed login", async () => {
    mockLogin.mockRejectedValue(new Error("E-mail ou senha inválidos."));

    await renderLogin();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/sua senha/i);
    const submitButton = screen.getByRole("button", { name: /entrar/i });

    await userEvent.type(emailInput, "test@academico.ufpb.br");
    await userEvent.type(passwordInput, "wrongpassword");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/e-mail ou senha inválidos/i)).toBeInTheDocument();
    });
  });

  it("should replace login with home on successful login", async () => {
    mockLogin.mockResolvedValue({ token: "test-token" });

    await renderLogin();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/sua senha/i);
    const submitButton = screen.getByRole("button", { name: /entrar/i });

    await userEvent.type(emailInput, "test@academico.ufpb.br");
    await userEvent.type(passwordInput, "password123");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("redirects a persisted authenticated session without rendering the login form", async () => {
    localStorage.setItem("token", "persisted-token");

    await renderLogin({ waitForForm: false });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
    expect(screen.queryByRole("heading", { name: /bem-vindo de volta/i })).not.toBeInTheDocument();
    expect(mockGetCurrentUser).toHaveBeenCalledWith("persisted-token");
  });

  it("keeps the login form hidden while the persisted session is being restored", async () => {
    localStorage.setItem("token", "persisted-token");
    mockGetCurrentUser.mockReturnValue(new Promise(() => undefined));

    await renderLogin({ waitForForm: false });

    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    expect(screen.getByText(/verificando sua sessão/i)).toBeInTheDocument();
  });

  it("ignores an older identity after leaving login and never mounts its onboarding", async () => {
    const staleUserResponse = createDeferred<typeof authenticatedUser>();
    const freshUserResponse = createDeferred<typeof authenticatedUser>();
    const freshOnboardingResponse = createDeferred<OnboardingMetadata>();
    const staleUser = {
      ...authenticatedUser,
      id: "stale-user",
      email: "stale@academico.ufpb.br",
    };
    const freshUser = {
      ...authenticatedUser,
      id: "fresh-user",
      email: "fresh@academico.ufpb.br",
    };
    const completedAt = "2026-08-23T00:00:00.000Z";
    const completedOnboarding: OnboardingMetadata = {
      welcome: { completedAt },
      periodo: { completedAt },
      concluidas: { completedAt },
      entidades: { completedAt },
      done: { completedAt },
      semesters: {
        "2026.2": {
          cursando: { completedAt },
          turmas: { completedAt },
        },
      },
    };
    localStorage.setItem("token", "stale-token");
    mockGetCurrentUser.mockImplementation(token =>
      token === "stale-token" ? staleUserResponse.promise : freshUserResponse.promise
    );
    mockGetOnboardingMetadata.mockImplementation(token =>
      token === "fresh-token" ? freshOnboardingResponse.promise : Promise.resolve({})
    );
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const application = () => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OnboardingProvider>
            <SessionSwitchHarness />
            <Login />
          </OnboardingProvider>
        </AuthProvider>
      </QueryClientProvider>
    );

    const view = render(application());

    expect(screen.queryByRole("dialog", { name: "Configuração inicial" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    expect(mockUsePathname()).toBe("/login");

    await userEvent.click(screen.getByRole("button", { name: "Switch session" }));

    await act(async () => {
      freshUserResponse.resolve(freshUser);
      await freshUserResponse.promise;
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
      expect(mockGetOnboardingMetadata).toHaveBeenCalledWith("fresh-token");
    });
    expect(screen.queryByRole("dialog", { name: "Configuração inicial" })).not.toBeInTheDocument();

    currentPathname = "/";
    view.rerender(application());

    await act(async () => {
      freshOnboardingResponse.resolve(completedOnboarding);
      await freshOnboardingResponse.promise;
    });

    await waitFor(() => {
      expect(queryClient.isFetching()).toBe(0);
      expect(
        screen.queryByRole("dialog", { name: "Configuração inicial" })
      ).not.toBeInTheDocument();
    });

    await act(async () => {
      staleUserResponse.resolve(staleUser);
      await staleUserResponse.promise;
    });

    expect(queryClient.getQueryData(queryKeys.usuarios.current("fresh-user"))).toEqual(freshUser);
    expect(queryClient.getQueryData(queryKeys.usuarios.current("stale-user"))).toBeUndefined();
    expect(mockGetOnboardingMetadata).not.toHaveBeenCalledWith("stale-token");
    expect(screen.queryByRole("dialog", { name: "Configuração inicial" })).not.toBeInTheDocument();
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
