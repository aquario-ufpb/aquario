/* eslint-disable require-await */
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { vagasService } from "../vagas";

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

const mockApiVaga = {
  id: "vaga-1",
  titulo: "Dev Frontend",
  descricao: "Descrição",
  tipoVaga: "ESTAGIO",
  areas: ["FrontEnd"],
  criadoEm: "2025-01-15T12:00:00.000Z",
  dataFinalizacao: "2025-06-30T23:59:59.000Z",
  linkInscricao: "https://example.com/apply",
  salario: "A combinar",
  sobreEmpresa: "Sobre",
  responsabilidades: ["Coding"],
  requisitos: ["React"],
  informacoesAdicionais: "Info",
  etapasProcesso: ["Entrevista"],
  entidade: { id: "ent-1", nome: "TRIL", slug: "tril" },
  publicador: { nome: "João", urlFotoPerfil: null },
};

describe("vagasService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return active vagas from API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockApiVaga],
      } as Response);

      const result = await vagasService.getAll();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/vagas"),
        expect.objectContaining({ method: "GET" })
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("vaga-1");
      expect(result[0].titulo).toBe("Dev Frontend");
      expect(result[0].linkInscricao).toBe("https://example.com/apply");
      expect(result[0].dataFinalizacao).toBe("2025-06-30T23:59:59.000Z");
      expect(result[0].entidade).toEqual({ id: "ent-1", nome: "TRIL", slug: "tril" });
    });
  });

  describe("getById", () => {
    it("should return vaga when found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockApiVaga,
      } as Response);

      const result = await vagasService.getById("vaga-1");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/vagas/vaga-1"),
        expect.objectContaining({ method: "GET" })
      );
      expect(result).not.toBeNull();
      expect(result!.id).toBe("vaga-1");
    });

    it("should return null when not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "Not found" }),
      } as Response);

      const result = await vagasService.getById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should POST to /api/vagas with token and body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockApiVaga,
      } as Response);

      await vagasService.create({
        titulo: "Nova vaga",
        descricao: "Desc",
        tipoVaga: "ESTAGIO",
        entidadeId: "ent-1",
        linkInscricao: "https://apply.com",
        dataFinalizacao: new Date("2025-12-31").toISOString(),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/vagas"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Nova vaga"),
        })
      );
    });
  });
});
