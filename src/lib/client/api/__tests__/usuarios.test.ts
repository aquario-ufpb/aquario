/* eslint-disable require-await */
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { usuariosService, type User } from "../usuarios";

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const mockUser: User = {
  id: "user-1",
  nome: "Test User",
  email: "test@academico.ufpb.br",
  papelPlataforma: "USER",
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

describe("usuariosService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCurrentUser", () => {
    it("should return user data on success", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      } as Response);

      const result = await usuariosService.getCurrentUser("token-123");

      expect(result).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/me"),
        expect.objectContaining({
          method: "GET",
          headers: {
            Authorization: "Bearer token-123",
          },
        })
      );
    });

    it("should throw error on failed request", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Falha ao buscar usuário" }),
      } as Response);

      await expect(usuariosService.getCurrentUser("token-123")).rejects.toThrow(
        "Falha ao buscar usuário"
      );
    });
  });

  describe("listUsersPaginated", () => {
    it("should return paginated users on success", async () => {
      const mockUsers = [mockUser, { ...mockUser, id: "user-2", nome: "User 2" }];
      const mockResponse = {
        users: mockUsers,
        pagination: {
          page: 1,
          limit: 25,
          total: 2,
          totalPages: 1,
        },
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await usuariosService.listUsersPaginated("token-123", { page: 1, limit: 25 });

      expect(result.users).toEqual(mockUsers);
      expect(result.users.length).toBe(2);
      expect(result.pagination.total).toBe(2);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/usuarios"),
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    it("should throw error on failed request", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: "Falha ao listar usuários" }),
      } as Response);

      await expect(
        usuariosService.listUsersPaginated("token-123", { page: 1, limit: 25 })
      ).rejects.toThrow("Falha ao listar usuários");
    });
  });

  describe("updateUserRole", () => {
    it("should return updated user on success", async () => {
      const updatedUser = { ...mockUser, papelPlataforma: "MASTER_ADMIN" as const };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedUser,
      } as Response);

      const result = await usuariosService.updateUserRole("user-1", "MASTER_ADMIN", "token-123");

      expect(result.papelPlataforma).toBe("MASTER_ADMIN");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/usuarios/user-1/role"),
        expect.objectContaining({
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer token-123",
          },
          body: JSON.stringify({ papelPlataforma: "MASTER_ADMIN" }),
        })
      );
    });

    it("should throw error on failed request", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Não autorizado" }),
      } as Response);

      await expect(
        usuariosService.updateUserRole("user-1", "MASTER_ADMIN", "token-123")
      ).rejects.toThrow("Não autorizado");
    });
  });

  describe("getBySlug", () => {
    it("should return user by slug", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      } as Response);

      const result = await usuariosService.getBySlug("test-user");

      expect(result).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/usuarios/slug/test-user"),
        expect.objectContaining({ method: "GET" })
      );
    });

    it("should throw error when user not found", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: "Usuário não encontrado" }),
      } as Response);

      await expect(usuariosService.getBySlug("nonexistent")).rejects.toThrow(
        "Usuário não encontrado"
      );
    });
  });

  describe("searchUsers", () => {
    it("should search users with query", async () => {
      const mockUsers = [mockUser];
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      } as Response);

      const result = await usuariosService.searchUsers("token-123", "test");

      expect(result).toEqual(mockUsers);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("search=test"),
        expect.any(Object)
      );
    });

    it("should include limit when provided", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await usuariosService.searchUsers("token-123", "test", 5);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=5"),
        expect.any(Object)
      );
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 204,
      } as Response);

      await expect(usuariosService.deleteUser("user-1", "token-123")).resolves.not.toThrow();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/usuarios/user-1"),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("should throw error on failure", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ message: "Não autorizado" }),
      } as Response);

      await expect(usuariosService.deleteUser("user-1", "token-123")).rejects.toThrow(
        "Não autorizado"
      );
    });
  });

  describe("createFacadeUser", () => {
    it("should create facade user", async () => {
      const facadeUser = { ...mockUser, eFacade: true };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => facadeUser,
      } as Response);

      const result = await usuariosService.createFacadeUser(
        { nome: "Facade User", centroId: "centro-1", cursoId: "curso-1" },
        "token-123"
      );

      expect(result.eFacade).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/usuarios/facade"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Facade User"),
        })
      );
    });
  });

  describe("updateUserInfo", () => {
    it("should update user info", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      } as Response);

      const result = await usuariosService.updateUserInfo(
        "user-1",
        { centroId: "centro-2" },
        "token-123"
      );

      expect(result).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/usuarios/user-1/info"),
        expect.objectContaining({ method: "PATCH" })
      );
    });
  });

  describe("updateUserSlug", () => {
    it("should update user slug", async () => {
      const updatedUser = { ...mockUser, slug: "new-slug" };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedUser,
      } as Response);

      const result = await usuariosService.updateUserSlug("user-1", "new-slug", "token-123");

      expect(result.slug).toBe("new-slug");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/usuarios/user-1/slug"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ slug: "new-slug" }),
        })
      );
    });
  });

  describe("photo operations", () => {
    it("should update photo", async () => {
      const updatedUser = { ...mockUser, urlFotoPerfil: "new-photo.jpg" };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedUser,
      } as Response);

      const result = await usuariosService.updatePhoto("new-photo.jpg", "token-123");

      expect(result.urlFotoPerfil).toBe("new-photo.jpg");
    });

    it("should delete photo", async () => {
      const updatedUser = { ...mockUser, urlFotoPerfil: null };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedUser,
      } as Response);

      const result = await usuariosService.deletePhoto("token-123");

      expect(result.urlFotoPerfil).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("membership operations", () => {
    const mockMembership = {
      id: "membership-1",
      entidade: {
        id: "ent-1",
        nome: "LabTech",
        slug: "labtech",
        tipo: "LABORATORIO",
        urlFoto: null,
        centro: { id: "centro-1", nome: "CI", sigla: "CI" },
      },
      papel: "MEMBRO" as const,
      cargo: null,
      startedAt: "2020-01-01",
      endedAt: null,
    };

    it("should get my memberships", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockMembership],
      } as Response);

      const result = await usuariosService.getMyMemberships("token-123");

      expect(result).toHaveLength(1);
      expect(result[0].entidade.nome).toBe("LabTech");
    });

    it("should get user memberships by id", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockMembership],
      } as Response);

      const result = await usuariosService.getUserMemberships("user-1");

      expect(result).toHaveLength(1);
    });
  });

  describe("mergeFacadeUser", () => {
    it("should merge facade user successfully", async () => {
      const mergeResult = {
        success: true,
        membershipsCopied: 3,
        conflicts: 0,
        facadeUserDeleted: true,
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mergeResult,
      } as Response);

      const result = await usuariosService.mergeFacadeUser(
        "facade-user-1",
        "real-user-1",
        true,
        "token-123"
      );

      expect(result.success).toBe(true);
      expect(result.membershipsCopied).toBe(3);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("facadeUserId"),
        })
      );
    });
  });
});
