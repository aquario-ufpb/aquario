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

  describe("register - Suporte a domínios institucionais", () => {
    const userDataBase = {
      nome: "Test User",
      senha: "password123",
      centroId: "centro-1",
      cursoId: "curso-1",
    };

    const mockSuccessResponse = () =>
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Usuário registrado com sucesso." }),
      } as Response);

    it("should allow registration with @academico.ufpb.br (backward compatibility)", async () => {
      mockSuccessResponse();
      const userData = { ...userDataBase, email: "aluno@academico.ufpb.br" };

      await authService.register(userData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/register"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
          body: JSON.stringify(userData), // Asserção forte do payload completo
        })
      );
    });

    it("should allow registration with subdomains like @dcx.ufpb.br", async () => {
      mockSuccessResponse();
      const userData = { ...userDataBase, email: "user@dcx.ufpb.br" };

      await authService.register(userData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/register"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(userData),
        })
      );
    });

    it("should throw error for non-UFPB domains (negative case)", async () => {
      const invalidData = { ...userDataBase, email: "user@gmail.com" };

      // Como o service deve validar ou a API retornar erro, simulamos a falha na API
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Apenas e-mails institucionais são permitidos." }),
      } as Response);

      await expect(authService.register(invalidData)).rejects.toThrow();
    });

    it("should throw error on failed registration (ex: email in use)", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Este e-mail já está em uso." }),
      } as Response);

      await expect(
        authService.register({ ...userDataBase, email: "test@academico.ufpb.br" })
      ).rejects.toThrow("Este e-mail já está em uso.");
    });
  });

  describe("verifyEmail", () => {
    it("should return success on valid token", async () => {
      const mockResponse = { success: true, message: "Email verificado com sucesso." };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authService.verifyEmail("valid-token");
      expect(result).toEqual(mockResponse);
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
      const mockResponse = { success: true, message: "Email de verificação reenviado." };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authService.resendVerification("token-123");
      expect(result).toEqual(mockResponse);
    });
  });

  describe("forgotPassword", () => {
    it("should always return success (security)", async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Email não encontrado" }),
      } as Response);

      const result = await authService.forgotPassword("test@academico.ufpb.br");
      expect(result.success).toBe(true);
      expect(result.message).toContain("receberá instruções");
    });
  });

  describe("resetPassword", () => {
    it("should return success on valid token and password", async () => {
      const mockResponse = { success: true, message: "Senha redefinida com sucesso." };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authService.resetPassword("valid-token", "newpassword123");
      expect(result).toEqual(mockResponse);
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
