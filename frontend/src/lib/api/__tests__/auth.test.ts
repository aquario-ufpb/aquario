/* eslint-disable require-await */
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { authService } from "../auth";

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("should return token on successful login", async () => {
      const mockToken = "test-token-123";
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: mockToken }),
      } as Response);

      const result = await authService.login("test@academico.ufpb.br", "password123");

      expect(result.token).toBe(mockToken);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/login"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@academico.ufpb.br", senha: "password123" }),
        })
      );
    });

    it("should throw error on failed login", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "E-mail ou senha inválidos." }),
      } as Response);

      await expect(authService.login("test@academico.ufpb.br", "wrongpassword")).rejects.toThrow(
        "E-mail ou senha inválidos."
      );
    });
  });

  describe("register", () => {
    it("should return registration response on success", async () => {
      const mockResponse = {
        message: "Usuário registrado com sucesso.",
        usuarioId: "user-123",
        verificado: false,
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authService.register({
        nome: "Test User",
        email: "test@academico.ufpb.br",
        senha: "password123",
        centroId: "centro-1",
        cursoId: "curso-1",
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/register"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    it("should throw error on failed registration", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Este e-mail já está em uso." }),
      } as Response);

      await expect(
        authService.register({
          nome: "Test User",
          email: "test@academico.ufpb.br",
          senha: "password123",
          centroId: "centro-1",
          cursoId: "curso-1",
        })
      ).rejects.toThrow("Este e-mail já está em uso.");
    });
  });

  describe("verifyEmail", () => {
    it("should return success on valid token", async () => {
      const mockResponse = {
        success: true,
        message: "Email verificado com sucesso.",
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authService.verifyEmail("valid-token");

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/verificar-email"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ token: "valid-token" }),
        })
      );
    });

    it("should throw error on invalid token", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Token inválido ou expirado." }),
      } as Response);

      await expect(authService.verifyEmail("invalid-token")).rejects.toThrow(
        "Token inválido ou expirado."
      );
    });
  });

  describe("resendVerification", () => {
    it("should return success on valid request", async () => {
      const mockResponse = {
        success: true,
        message: "Email de verificação reenviado.",
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authService.resendVerification("token-123");

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/reenviar-verificacao"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer token-123",
          }),
        })
      );
    });
  });

  describe("forgotPassword", () => {
    it("should always return success (security)", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false, // Simulate error
        json: async () => ({ message: "Email não encontrado" }),
      } as Response);

      const result = await authService.forgotPassword("test@academico.ufpb.br");

      // Should still return success even on error
      expect(result.success).toBe(true);
      expect(result.message).toContain("receberá instruções");
    });

    it("should return success on valid request", async () => {
      const mockResponse = {
        success: true,
        message: "Email enviado com sucesso.",
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authService.forgotPassword("test@academico.ufpb.br");

      expect(result.success).toBe(true);
    });
  });

  describe("resetPassword", () => {
    it("should return success on valid token and password", async () => {
      const mockResponse = {
        success: true,
        message: "Senha redefinida com sucesso.",
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authService.resetPassword("valid-token", "newpassword123");

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/resetar-senha"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ token: "valid-token", novaSenha: "newpassword123" }),
        })
      );
    });

    it("should throw error on invalid token", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Token inválido ou expirado." }),
      } as Response);

      await expect(authService.resetPassword("invalid-token", "newpassword123")).rejects.toThrow(
        "Token inválido ou expirado."
      );
    });
  });
});
