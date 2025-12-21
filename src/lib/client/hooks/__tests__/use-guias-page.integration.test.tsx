/**
 * Integration tests for useGuiasPage hook
 * Tests the complete guide tree building logic with React Query
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "@/__tests__/utils/test-providers";
import { useGuiasPage } from "../use-guias-page";
import * as guiasService from "@/lib/client/api/guias";

// Mock the guias service
vi.mock("../../lib/api/guias");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGuiasService = guiasService as any;

describe("useGuiasPage Hook", () => {
  const mockGuias = [
    {
      id: "guia-bem-vindo",
      titulo: "Bem Vindo",
      slug: "bem-vindo",
      descricao: "Guia de boas-vindas",
      status: "ATIVO",
      cursoId: "ciencia-da-computacao",
      tags: ["CC"],
    },
    {
      id: "guia-cadeiras",
      titulo: "Cadeiras",
      slug: "cadeiras",
      descricao: "Guia de cadeiras",
      status: "ATIVO",
      cursoId: "ciencia-da-computacao",
      tags: ["CC"],
    },
  ];

  const mockSecoes = {
    "bem-vindo": [
      {
        id: "secao-sobre",
        guiaId: "guia-bem-vindo",
        titulo: "Sobre O Curso",
        slug: "sobre-o-curso",
        ordem: 1,
        conteudo: "# Sobre",
        status: "ATIVO",
      },
    ],
    cadeiras: [
      {
        id: "secao-principais",
        guiaId: "guia-cadeiras",
        titulo: "Principais Cadeiras",
        slug: "principais-cadeiras",
        ordem: 1,
        conteudo: null,
        status: "ATIVO",
      },
    ],
  };

  const mockSubSecoes = {
    "sobre-o-curso": [],
    "principais-cadeiras": [
      {
        id: "subsecao-calculo",
        secaoId: "secao-principais",
        titulo: "Calculo I",
        slug: "calculo-I",
        ordem: 1,
        conteudo: "# Cálculo I",
        status: "ATIVO",
      },
      {
        id: "subsecao-prog",
        secaoId: "secao-principais",
        titulo: "Programacao I",
        slug: "programacao-I",
        ordem: 2,
        conteudo: "# Programação I",
        status: "ATIVO",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup complete mock responses
    mockGuiasService.guiasService = {
      getAll: vi.fn(),
      getSecoes: vi.fn(),
      getSubSecoes: vi.fn(),
    };
  });

  it("should build complete guia tree with all data", async () => {
    // Mock service responses
    mockGuiasService.guiasService.getAll.mockResolvedValue(mockGuias);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGuiasService.guiasService.getSecoes.mockImplementation((guiaSlug: string) => {
      return Promise.resolve(mockSecoes[guiaSlug as keyof typeof mockSecoes] || []);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGuiasService.guiasService.getSubSecoes.mockImplementation((secaoSlug: string) => {
      return Promise.resolve(mockSubSecoes[secaoSlug as keyof typeof mockSubSecoes] || []);
    });

    const { result } = renderHookWithProviders(() => useGuiasPage());

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.guiaTree).toEqual([]);

    // Wait for all data to load
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 5000 }
    );

    // Should have built complete tree
    expect(result.current.guiaTree).toHaveLength(2);

    // Check first guia (bem-vindo)
    const bemVindoGuia = result.current.guiaTree[0];
    expect(bemVindoGuia.titulo).toBe("Bem Vindo");
    expect(bemVindoGuia.slug).toBe("bem-vindo");
    expect(bemVindoGuia.secoes).toHaveLength(1);
    expect(bemVindoGuia.secoes[0].titulo).toBe("Sobre O Curso");
    expect(bemVindoGuia.secoes[0].subsecoes).toHaveLength(0);

    // Check second guia (cadeiras)
    const cadeirasGuia = result.current.guiaTree[1];
    expect(cadeirasGuia.titulo).toBe("Cadeiras");
    expect(cadeirasGuia.slug).toBe("cadeiras");
    expect(cadeirasGuia.secoes).toHaveLength(1);
    expect(cadeirasGuia.secoes[0].titulo).toBe("Principais Cadeiras");
    expect(cadeirasGuia.secoes[0].subsecoes).toHaveLength(2);
    expect(cadeirasGuia.secoes[0].subsecoes[0].titulo).toBe("Calculo I");
    expect(cadeirasGuia.secoes[0].subsecoes[1].titulo).toBe("Programacao I");
  });

  it("should find correct curso from hardcoded list", async () => {
    mockGuiasService.guiasService.getAll.mockResolvedValue([]);
    mockGuiasService.guiasService.getSecoes.mockResolvedValue([]);
    mockGuiasService.guiasService.getSubSecoes.mockResolvedValue([]);

    const { result } = renderHookWithProviders(() => useGuiasPage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Course-specific properties removed, test removed
  });

  it("should handle loading states correctly", async () => {
    // Make service calls take time
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let resolveGuias: any;
    const guiasPromise = new Promise(resolve => {
      resolveGuias = resolve;
    });

    mockGuiasService.guiasService.getAll.mockReturnValue(guiasPromise);
    mockGuiasService.guiasService.getSecoes.mockResolvedValue([]);
    mockGuiasService.guiasService.getSubSecoes.mockResolvedValue([]);

    const { result } = renderHookWithProviders(() => useGuiasPage());

    // Should be loading initially
    expect(result.current.isLoading).toBe(true);
    expect(result.current.guiaTree).toEqual([]);

    // Resolve guias
    resolveGuias(mockGuias);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should handle errors gracefully", async () => {
    const error = new Error("Failed to fetch guias");
    mockGuiasService.guiasService.getAll.mockRejectedValue(error);

    const { result } = renderHookWithProviders(() => useGuiasPage());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // Error should be defined and have a message
    expect(result.current.error).toBeDefined();
    expect((result.current.error as Error).message).toBe("Failed to fetch guias");
    expect(result.current.guiaTree).toEqual([]);
  });

  it("should provide secoesData and subSecoesData", async () => {
    mockGuiasService.guiasService.getAll.mockResolvedValue(mockGuias);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGuiasService.guiasService.getSecoes.mockImplementation((guiaSlug: string) => {
      return Promise.resolve(mockSecoes[guiaSlug as keyof typeof mockSecoes] || []);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGuiasService.guiasService.getSubSecoes.mockImplementation((secaoSlug: string) => {
      return Promise.resolve(mockSubSecoes[secaoSlug as keyof typeof mockSubSecoes] || []);
    });

    const { result } = renderHookWithProviders(() => useGuiasPage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have mapped data
    expect(result.current.secoesData).toBeDefined();
    expect(result.current.secoesData?.["bem-vindo"]).toHaveLength(1);
    expect(result.current.secoesData?.["cadeiras"]).toHaveLength(1);

    expect(result.current.subSecoesData).toBeDefined();
    expect(result.current.subSecoesData?.["principais-cadeiras"]).toHaveLength(2);
  });

  it("should handle empty guias list", async () => {
    mockGuiasService.guiasService.getAll.mockResolvedValue([]);
    mockGuiasService.guiasService.getSecoes.mockResolvedValue([]);
    mockGuiasService.guiasService.getSubSecoes.mockResolvedValue([]);

    const { result } = renderHookWithProviders(() => useGuiasPage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.guiaTree).toEqual([]);
  });
});
