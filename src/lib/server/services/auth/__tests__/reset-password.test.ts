import {
  resetPassword,
  type ResetPasswordInput,
  type ResetPasswordDependencies,
} from "../reset-password";
import { hash } from "bcryptjs";

// Mock bcryptjs
jest.mock("bcryptjs");

describe("resetPassword", () => {
  let mockDeps: jest.Mocked<ResetPasswordDependencies>;

  beforeEach(() => {
    mockDeps = {
      tokenVerificacaoRepository: {
        findByToken: jest.fn(),
        markAsUsed: jest.fn(),
        create: jest.fn(),
        deleteByUsuarioId: jest.fn(),
        deleteExpired: jest.fn(),
      } as any,
      usuariosRepository: {
        findById: jest.fn(),
        updatePassword: jest.fn(),
        findByEmail: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        list: jest.fn(),
        count: jest.fn(),
      } as any,
    };

    (hash as jest.Mock).mockResolvedValue("hashed-new-password");

    jest.clearAllMocks();
  });

  it("should successfully reset password with valid token", async () => {
    const input: ResetPasswordInput = {
      token: "valid-reset-token",
      novaSenha: "newPassword123",
    };

    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    mockDeps.tokenVerificacaoRepository.findByToken.mockResolvedValue({
      id: "token-1",
      usuarioId: "user-123",
      token: "valid-reset-token",
      tipo: "RESET_SENHA",
      expiraEm: futureDate,
      usadoEm: null,
      criadoEm: new Date(),
    });

    mockDeps.usuariosRepository.findById.mockResolvedValue({
      id: "user-123",
      nome: "Test User",
      email: "test@example.com",
    } as any);

    const result = await resetPassword(input, mockDeps);

    expect(result.success).toBe(true);
    expect(result.message).toContain("redefinida com sucesso");
    expect(hash).toHaveBeenCalledWith("newPassword123", 10);
    expect(mockDeps.usuariosRepository.updatePassword).toHaveBeenCalledWith(
      "user-123",
      "hashed-new-password"
    );
    expect(mockDeps.tokenVerificacaoRepository.markAsUsed).toHaveBeenCalledWith("token-1");
  });

  it("should throw error if password is too short", async () => {
    const input: ResetPasswordInput = {
      token: "valid-token",
      novaSenha: "short",
    };

    await expect(resetPassword(input, mockDeps)).rejects.toThrow(
      "A senha deve ter pelo menos 8 caracteres."
    );
  });

  it("should throw error if password is too long", async () => {
    const input: ResetPasswordInput = {
      token: "valid-token",
      novaSenha: "a".repeat(129),
    };

    await expect(resetPassword(input, mockDeps)).rejects.toThrow(
      "A senha deve ter no máximo 128 caracteres."
    );
  });

  it("should accept password with exactly 8 characters", async () => {
    const input: ResetPasswordInput = {
      token: "valid-token",
      novaSenha: "12345678",
    };

    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    mockDeps.tokenVerificacaoRepository.findByToken.mockResolvedValue({
      id: "token-1",
      usuarioId: "user-123",
      token: "valid-token",
      tipo: "RESET_SENHA",
      expiraEm: futureDate,
      usadoEm: null,
      criadoEm: new Date(),
    });

    mockDeps.usuariosRepository.findById.mockResolvedValue({
      id: "user-123",
    } as any);

    const result = await resetPassword(input, mockDeps);

    expect(result.success).toBe(true);
  });

  it("should accept password with exactly 128 characters", async () => {
    const input: ResetPasswordInput = {
      token: "valid-token",
      novaSenha: "a".repeat(128),
    };

    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    mockDeps.tokenVerificacaoRepository.findByToken.mockResolvedValue({
      id: "token-1",
      usuarioId: "user-123",
      token: "valid-token",
      tipo: "RESET_SENHA",
      expiraEm: futureDate,
      usadoEm: null,
      criadoEm: new Date(),
    });

    mockDeps.usuariosRepository.findById.mockResolvedValue({
      id: "user-123",
    } as any);

    const result = await resetPassword(input, mockDeps);

    expect(result.success).toBe(true);
  });

  it("should throw error if token not found", async () => {
    const input: ResetPasswordInput = {
      token: "invalid-token",
      novaSenha: "newPassword123",
    };

    mockDeps.tokenVerificacaoRepository.findByToken.mockResolvedValue(null);

    await expect(resetPassword(input, mockDeps)).rejects.toThrow("Token inválido ou expirado.");
  });

  it("should throw error if token is expired", async () => {
    const input: ResetPasswordInput = {
      token: "expired-token",
      novaSenha: "newPassword123",
    };

    const pastDate = new Date(Date.now() - 60 * 60 * 1000);
    mockDeps.tokenVerificacaoRepository.findByToken.mockResolvedValue({
      id: "token-1",
      usuarioId: "user-123",
      token: "expired-token",
      tipo: "RESET_SENHA",
      expiraEm: pastDate,
      usadoEm: null,
      criadoEm: new Date(),
    });

    await expect(resetPassword(input, mockDeps)).rejects.toThrow("Token expirado");
  });

  it("should throw error if token was already used", async () => {
    const input: ResetPasswordInput = {
      token: "used-token",
      novaSenha: "newPassword123",
    };

    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    const usedDate = new Date(Date.now() - 1000);
    mockDeps.tokenVerificacaoRepository.findByToken.mockResolvedValue({
      id: "token-1",
      usuarioId: "user-123",
      token: "used-token",
      tipo: "RESET_SENHA",
      expiraEm: futureDate,
      usadoEm: usedDate,
      criadoEm: new Date(),
    });

    await expect(resetPassword(input, mockDeps)).rejects.toThrow("Este link já foi utilizado.");
  });

  it("should throw error if token type is not RESET_SENHA", async () => {
    const input: ResetPasswordInput = {
      token: "wrong-type-token",
      novaSenha: "newPassword123",
    };

    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    mockDeps.tokenVerificacaoRepository.findByToken.mockResolvedValue({
      id: "token-1",
      usuarioId: "user-123",
      token: "wrong-type-token",
      tipo: "VERIFICACAO_EMAIL", // Wrong type
      expiraEm: futureDate,
      usadoEm: null,
      criadoEm: new Date(),
    });

    await expect(resetPassword(input, mockDeps)).rejects.toThrow("Token inválido.");
  });

  it("should throw error if user not found", async () => {
    const input: ResetPasswordInput = {
      token: "valid-token",
      novaSenha: "newPassword123",
    };

    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    mockDeps.tokenVerificacaoRepository.findByToken.mockResolvedValue({
      id: "token-1",
      usuarioId: "nonexistent-user",
      token: "valid-token",
      tipo: "RESET_SENHA",
      expiraEm: futureDate,
      usadoEm: null,
      criadoEm: new Date(),
    });

    mockDeps.usuariosRepository.findById.mockResolvedValue(null);

    await expect(resetPassword(input, mockDeps)).rejects.toThrow("Usuário não encontrado.");
  });

  it("should hash password before updating", async () => {
    const input: ResetPasswordInput = {
      token: "valid-token",
      novaSenha: "mySecretPassword",
    };

    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    mockDeps.tokenVerificacaoRepository.findByToken.mockResolvedValue({
      id: "token-1",
      usuarioId: "user-123",
      token: "valid-token",
      tipo: "RESET_SENHA",
      expiraEm: futureDate,
      usadoEm: null,
      criadoEm: new Date(),
    });

    mockDeps.usuariosRepository.findById.mockResolvedValue({
      id: "user-123",
    } as any);

    await resetPassword(input, mockDeps);

    expect(hash).toHaveBeenCalledWith("mySecretPassword", 10);
  });

  it("should process all operations in correct order", async () => {
    const input: ResetPasswordInput = {
      token: "complete-flow-token",
      novaSenha: "newPassword123",
    };

    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    mockDeps.tokenVerificacaoRepository.findByToken.mockResolvedValue({
      id: "token-1",
      usuarioId: "user-123",
      token: "complete-flow-token",
      tipo: "RESET_SENHA",
      expiraEm: futureDate,
      usadoEm: null,
      criadoEm: new Date(),
    });

    mockDeps.usuariosRepository.findById.mockResolvedValue({
      id: "user-123",
    } as any);

    await resetPassword(input, mockDeps);

    // Verify order of operations
    expect(mockDeps.tokenVerificacaoRepository.findByToken).toHaveBeenCalledWith(
      "complete-flow-token"
    );
    expect(mockDeps.usuariosRepository.findById).toHaveBeenCalledWith("user-123");
    expect(hash).toHaveBeenCalled();
    expect(mockDeps.usuariosRepository.updatePassword).toHaveBeenCalledWith(
      "user-123",
      "hashed-new-password"
    );
    expect(mockDeps.tokenVerificacaoRepository.markAsUsed).toHaveBeenCalledWith("token-1");
  });
});
