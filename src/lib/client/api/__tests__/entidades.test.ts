/* eslint-disable require-await */
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { entidadesService } from "../entidades";
import type { TipoEntidade } from "@/lib/shared/types";

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

const mockApiEntidade = {
  id: "ent-1",
  nome: "LabTech",
  slug: "labtech",
  subtitle: "Lab subtitle",
  descricao: "A tech lab",
  tipo: "LABORATORIO",
  urlFoto: "labtech.png",
  contato: "lab@ufpb.br",
  instagram: "@labtech",
  linkedin: "labtech",
  website: "https://labtech.com",
  location: "CI building",
  foundingDate: "2020-01-15T00:00:00.000Z",
  metadata: { order: 1 },
  centroId: "centro-1",
  centro: {
    id: "centro-1",
    nome: "Centro de Informática",
    sigla: "CI",
  },
};

const mockMembro = {
  id: "membro-1",
  usuario: {
    id: "user-1",
    nome: "John Doe",
    slug: "john-doe",
    urlFotoPerfil: null,
    eFacade: false,
    curso: { nome: "Ciência da Computação" },
  },
  papel: "ADMIN" as const,
  cargo: {
    id: "cargo-1",
    nome: "Coordenador",
    descricao: null,
    ordem: 1,
  },
  startedAt: "2020-01-01",
  endedAt: null,
};

const mockCargo = {
  id: "cargo-1",
  nome: "Coordenador",
  descricao: "Coordinates the lab",
  ordem: 1,
  entidadeId: "ent-1",
};

describe("entidadesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return all entities mapped correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [mockApiEntidade],
      } as Response);

      const result = await entidadesService.getAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("ent-1");
      expect(result[0].name).toBe("LabTech");
      expect(result[0].slug).toBe("labtech");
      expect(result[0].tipo).toBe("LABORATORIO");
      expect(result[0].imagePath).toBe("/api/content-images/assets/entidades/labtech.png");
      expect(result[0].founding_date).toBe("2020-01-15");
      expect(result[0].order).toBe(1);
    });

    it("should throw error on failed request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Server error" }),
      } as Response);

      await expect(entidadesService.getAll()).rejects.toThrow("Server error");
    });

    it("should use default image when urlFoto is null", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ ...mockApiEntidade, urlFoto: null }],
      } as Response);

      const result = await entidadesService.getAll();

      expect(result[0].imagePath).toBe("/api/content-images/assets/entidades/default.png");
    });

    it("should generate slug from nome when slug is null", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ ...mockApiEntidade, slug: null, nome: "Grupo de Pesquisa" }],
      } as Response);

      const result = await entidadesService.getAll();

      expect(result[0].slug).toBe("grupo-de-pesquisa");
    });

    it("should normalize invalid tipo to OUTRO", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ ...mockApiEntidade, tipo: "INVALID_TYPE" }],
      } as Response);

      const result = await entidadesService.getAll();

      expect(result[0].tipo).toBe("OUTRO");
    });
  });

  describe("getBySlug", () => {
    it("should return entity when found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...mockApiEntidade, membros: [mockMembro] }),
      } as Response);

      const result = await entidadesService.getBySlug("labtech");

      expect(result).not.toBeNull();
      expect(result!.id).toBe("ent-1");
      expect(result!.membros).toHaveLength(1);
    });

    it("should return null when not found (404)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const result = await entidadesService.getBySlug("nonexistent");

      expect(result).toBeNull();
    });

    it("should throw error on other failures", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Server error" }),
      } as Response);

      await expect(entidadesService.getBySlug("labtech")).rejects.toThrow("Server error");
    });
  });

  describe("getByTipo", () => {
    it("should filter entities by tipo", async () => {
      const lab = { ...mockApiEntidade, tipo: "LABORATORIO" };
      const grupo = { ...mockApiEntidade, id: "ent-2", tipo: "GRUPO" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [lab, grupo],
      } as Response);

      const result = await entidadesService.getByTipo("LABORATORIO" as TipoEntidade);

      expect(result).toHaveLength(1);
      expect(result[0].tipo).toBe("LABORATORIO");
    });
  });

  describe("update", () => {
    it("should update entity with mapped fields", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      await entidadesService.update(
        "ent-1",
        {
          nome: "New Name",
          description: "New description",
          contato_email: "new@email.com",
        },
        "token-123"
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/entidades/ent-1"),
        expect.objectContaining({
          method: "PUT",
          headers: expect.objectContaining({
            Authorization: "Bearer token-123",
          }),
          body: expect.stringContaining('"nome":"New Name"'),
        })
      );
    });

    it("should throw error on failed update", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: "Not authorized" }),
      } as Response);

      await expect(entidadesService.update("ent-1", { nome: "New" }, "token-123")).rejects.toThrow(
        "Not authorized"
      );
    });

    it("should handle image path extraction", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      await entidadesService.update(
        "ent-1",
        { imagePath: "assets/entidades/new-image.png" },
        "token-123"
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(body.urlFoto).toBe("new-image.png");
    });

    it("should handle null image path", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      await entidadesService.update("ent-1", { imagePath: null }, "token-123");

      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(body.urlFoto).toBeNull();
    });

    it("should convert founding_date to ISO string", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      await entidadesService.update("ent-1", { founding_date: "2020-01-15" }, "token-123");

      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(body.foundingDate).toContain("2020-01-15");
    });
  });

  describe("member operations", () => {
    describe("addMember", () => {
      it("should add member with correct data", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => mockMembro,
        } as Response);

        const result = await entidadesService.addMember(
          "ent-1",
          { usuarioId: "user-1", papel: "MEMBRO" },
          "token-123"
        );

        expect(result.id).toBe("membro-1");
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/entidades/ent-1/membros"),
          expect.objectContaining({
            method: "POST",
          })
        );
      });

      it("should throw error on failure", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ message: "User already member" }),
        } as Response);

        await expect(
          entidadesService.addMember("ent-1", { usuarioId: "user-1", papel: "MEMBRO" }, "token")
        ).rejects.toThrow("User already member");
      });
    });

    describe("updateMember", () => {
      it("should update member", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ...mockMembro, papel: "MEMBRO" }),
        } as Response);

        const result = await entidadesService.updateMember(
          "ent-1",
          "membro-1",
          { papel: "MEMBRO" },
          "token"
        );

        expect(result.papel).toBe("MEMBRO");
      });
    });

    describe("deleteMember", () => {
      it("should delete member", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
        } as Response);

        await expect(
          entidadesService.deleteMember("ent-1", "membro-1", "token")
        ).resolves.not.toThrow();
      });
    });
  });

  describe("cargo operations", () => {
    describe("getCargos", () => {
      it("should return cargos for entity", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [mockCargo],
        } as Response);

        const result = await entidadesService.getCargos("ent-1");

        expect(result).toHaveLength(1);
        expect(result[0].nome).toBe("Coordenador");
      });
    });

    describe("createCargo", () => {
      it("should create cargo", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => mockCargo,
        } as Response);

        const result = await entidadesService.createCargo(
          "ent-1",
          { nome: "Coordenador", ordem: 1 },
          "token"
        );

        expect(result.id).toBe("cargo-1");
      });
    });

    describe("updateCargo", () => {
      it("should update cargo", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ...mockCargo, nome: "Updated" }),
        } as Response);

        const result = await entidadesService.updateCargo(
          "ent-1",
          "cargo-1",
          { nome: "Updated" },
          "token"
        );

        expect(result.nome).toBe("Updated");
      });
    });

    describe("deleteCargo", () => {
      it("should delete cargo", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 204,
        } as Response);

        await expect(
          entidadesService.deleteCargo("ent-1", "cargo-1", "token")
        ).resolves.not.toThrow();
      });
    });
  });
});
