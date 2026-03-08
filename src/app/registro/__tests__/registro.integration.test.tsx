/**
 * Integration tests for Registration page
 * Tests registration flow, validation, and email verification handling
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import Registro from "../page";
import { TestQueryProvider } from "@/__tests__/utils/test-providers";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock useBackend to return true for these tests
vi.mock("@/lib/shared/config/env", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/shared/config/env")>();
  return {
    ...actual,
    useBackend: () => ({ isEnabled: true }),
  };
});

// Mock services
vi.mock("@/lib/client/api/auth", () => ({
  authService: {
    register: vi.fn(),
  },
}));
vi.mock("@/lib/client/api/cursos", () => ({
  cursosService: {
    getAll: vi.fn(),
  },
}));

// Import after mocking
import { authService } from "@/lib/client/api/auth";
import { cursosService } from "@/lib/client/api/cursos";

const mockRegister = vi.mocked(authService.register);
const mockGetAllCursos = vi.mocked(cursosService.getAll);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRouter = useRouter as any;

describe("Registration Page", () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();
  const mockCursos = [
    { id: "curso-1", nome: "Ciência da Computação", centroId: "centro-1" },
    { id: "curso-2", nome: "Engenharia da Computação", centroId: "centro-1" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    mockGetAllCursos.mockResolvedValue(mockCursos);
  });

  it("should render registration form", async () => {
    render(
      <TestQueryProvider>
        <Registro />
      </TestQueryProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/mínimo de 8 caracteres/i)).toBeInTheDocument();

    // Check for Curso label
    const cursoLabel = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === "label" && /curso/i.test(content);
    });
    expect(cursoLabel).toBeInTheDocument();
  });

  it("should load cursos on mount", async () => {
    render(
      <TestQueryProvider>
        <Registro />
      </TestQueryProvider>
    );

    await waitFor(() => {
      expect(mockGetAllCursos).toHaveBeenCalled();
    });
  });

  it.skip("should show error on failed registration", async () => {
    // Skipped due to Radix UI Select compatibility issues with happy-dom
    mockRegister.mockRejectedValue(new Error("Este e-mail já está em uso."));

    render(
      <TestQueryProvider>
        <Registro />
      </TestQueryProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument();
    });
  });

  it.skip("should redirect to login after successful registration", async () => {
    // Skipped due to Radix UI Select compatibility issues with happy-dom
    mockRegister.mockResolvedValue({
      message: "Usuário registrado com sucesso.",
      usuarioId: "user-1",
      verificado: false,
    });

    render(
      <TestQueryProvider>
        <Registro />
      </TestQueryProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument();
    });
  });
});
