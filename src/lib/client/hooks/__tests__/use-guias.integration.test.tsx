/**
 * Integration tests for useGuias, useSecoes, and useSubSecoes hooks
 * Tests React Query integration, caching, loading states, and error handling
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "@/__tests__/utils/test-providers";
import { useGuias, useSecoes, useSubSecoes } from "../use-guias";

// Mock the guias service
vi.mock("@/lib/client/api/guias", () => ({
  guiasService: {
    getAll: vi.fn(),
    getSecoes: vi.fn(),
    getSubSecoes: vi.fn(),
  },
}));

// Import after mocking
import { guiasService } from "@/lib/client/api/guias";

const mockGetAll = vi.mocked(guiasService.getAll);
const mockGetSecoes = vi.mocked(guiasService.getSecoes);
const mockGetSubSecoes = vi.mocked(guiasService.getSubSecoes);

describe("useGuias Hook", () => {
  const mockGuias = [
    {
      id: "guia-1",
      titulo: "Bem Vindo",
      slug: "bem-vindo",
      descricao: "Guia de boas-vindas",
      status: "ATIVO",
      cursoId: "ciencia-da-computacao",
      tags: ["CC", "Bem Vindo"],
    },
    {
      id: "guia-2",
      titulo: "Cadeiras",
      slug: "cadeiras",
      descricao: "Guia de cadeiras",
      status: "ATIVO",
      cursoId: "ciencia-da-computacao",
      tags: ["CC", "Cadeiras"],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch all guias", async () => {
    mockGetAll.mockResolvedValue(mockGuias);

    const { result } = renderHookWithProviders(() => useGuias());

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockGuias);
    expect(result.current.isSuccess).toBe(true);
    expect(mockGetAll).toHaveBeenCalled();
  });

  it("should handle errors gracefully", async () => {
    const error = new Error("Failed to fetch guias");
    mockGetAll.mockRejectedValue(error);

    const { result } = renderHookWithProviders(() => useGuias());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });

  it("should cache results with React Query", async () => {
    mockGetAll.mockResolvedValue(mockGuias);

    const { result: result1, rerender } = renderHookWithProviders(() => useGuias());

    await waitFor(() => {
      expect(result1.current.isSuccess).toBe(true);
    });

    expect(result1.current.data).toEqual(mockGuias);

    // Rerender should use cached data
    rerender();

    expect(result1.current.data).toEqual(mockGuias);

    // Service should only be called once due to caching
    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });
});

describe("useSecoes Hook", () => {
  const mockSecoes = [
    {
      id: "secao-1",
      guiaId: "guia-bem-vindo",
      titulo: "Sobre O Curso",
      slug: "sobre-o-curso",
      ordem: 1,
      conteudo: "# Sobre o curso",
      status: "ATIVO",
    },
    {
      id: "secao-2",
      guiaId: "guia-bem-vindo",
      titulo: "Grade Curricular",
      slug: "grade-curricular",
      ordem: 2,
      conteudo: "# Grade",
      status: "ATIVO",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch secoes for a given guia", async () => {
    mockGetSecoes.mockResolvedValue(mockSecoes);

    const { result } = renderHookWithProviders(() => useSecoes("bem-vindo"));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSecoes);
    expect(mockGetSecoes).toHaveBeenCalledWith("bem-vindo");
  });

  it("should not fetch when guiaSlug is empty", async () => {
    const { result } = renderHookWithProviders(() => useSecoes(""));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetSecoes).not.toHaveBeenCalled();
  });
});

describe("useSubSecoes Hook", () => {
  const mockSubSecoes = [
    {
      id: "subsecao-1",
      secaoId: "secao-principais-cadeiras",
      titulo: "Calculo I",
      slug: "calculo-I",
      ordem: 1,
      conteudo: "# Cálculo I",
      status: "ATIVO",
    },
    {
      id: "subsecao-2",
      secaoId: "secao-principais-cadeiras",
      titulo: "Programacao I",
      slug: "programacao-I",
      ordem: 2,
      conteudo: "# Programação I",
      status: "ATIVO",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch subsecoes for a given secao", async () => {
    mockGetSubSecoes.mockResolvedValue(mockSubSecoes);

    const { result } = renderHookWithProviders(() => useSubSecoes("principais-cadeiras"));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSubSecoes);
    expect(mockGetSubSecoes).toHaveBeenCalledWith("principais-cadeiras");
  });

  it("should not fetch when secaoSlug is empty", async () => {
    const { result } = renderHookWithProviders(() => useSubSecoes(""));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetSubSecoes).not.toHaveBeenCalled();
  });

  it("should handle errors", async () => {
    const error = new Error("Failed to fetch subsecoes");
    mockGetSubSecoes.mockRejectedValue(error);

    const { result } = renderHookWithProviders(() => useSubSecoes("principais-cadeiras"));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
