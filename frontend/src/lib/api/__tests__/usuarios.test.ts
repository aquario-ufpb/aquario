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
      } as Response);

      await expect(usuariosService.getCurrentUser("token-123")).rejects.toThrow(
        "Falha ao buscar usuário"
      );
    });
  });

  describe("listUsers", () => {
    it("should return array of users on success", async () => {
      const mockUsers = [mockUser, { ...mockUser, id: "user-2", nome: "User 2" }];
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      } as Response);

      const result = await usuariosService.listUsers("token-123");

      expect(result).toEqual(mockUsers);
      expect(result.length).toBe(2);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/usuarios"),
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
      } as Response);

      await expect(usuariosService.listUsers("token-123")).rejects.toThrow(
        "Falha ao listar usuários"
      );
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
});
