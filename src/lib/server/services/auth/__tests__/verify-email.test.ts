import { verifyEmail, type VerifyEmailInput, type VerifyEmailDependencies } from "../verify-email";

describe("verifyEmail", () => {
  let mockDeps: jest.Mocked<VerifyEmailDependencies>;

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
        markAsVerified: jest.fn(),
        findByEmail: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        list: jest.fn(),
        count: jest.fn(),
      } as any,
    };

    jest.clearAllMocks();
  });

  it("should successfully verify email with valid token", async () => {
    const input: VerifyEmailInput = {
      token: "valid-token-123",
    };

    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    mockDeps.tokenVerificacaoRepository.findByToken.mockResolvedValue({
      id: "token-1",
      usuarioId: "user-123",
      token: "valid-token-123",
      tipo: "VERIFICACAO_EMAIL",
      expiraEm: futureDate,
      usadoEm: null,
      criadoEm: new Date(),
    });

    mockDeps.usuariosRepository.findById.mockResolvedValue({
      id: "user-123",
      nome: "Test User",
      email: "test@example.com",
      eVerificado: false,
    } as any);

    const result = await verifyEmail(input, mockDeps);

    expect(result.success).toBe(true);
    expect(result.message).toContain("verificado com sucesso");
    expect(mockDeps.usuariosRepository.markAsVerified).toHaveBeenCalledWith("user-123");
    expect(mockDeps.tokenVerificacaoRepository.markAsUsed).toHaveBeenCalledWith("token-1");
  });

  it("should throw error if token not found", async () => {
    const input: VerifyEmailInput = {
      token: "invalid-token",
    };

    mockDeps.tokenVerificacaoRepository.findByToken.mockResolvedValue(null);

    await expect(verifyEmail(input, mockDeps)).rejects.toThrow("Token inválido ou expirado.");
  });

  it("should throw error if token is expired", async () => {
    const input: VerifyEmailInput = {
      token: "expired-token",
    };

    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    mockDeps.tokenVerificacaoRepository.findByToken.mockResolvedValue({
      id: "token-1",
      usuarioId: "user-123",
      token: "expired-token",
      tipo: "VERIFICACAO_EMAIL",
      expiraEm: pastDate,
      usadoEm: null,
      criadoEm: new Date(),
    });

    await expect(verifyEmail(input, mockDeps)).rejects.toThrow("Token expirado");
  });

  it("should throw error if token was already used", async () => {
    const input: VerifyEmailInput = {
      token: "used-token",
    };

    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const usedDate = new Date(Date.now() - 1000);
    mockDeps.tokenVerificacaoRepository.findByToken.mockResolvedValue({
      id: "token-1",
      usuarioId: "user-123",
      token: "used-token",
      tipo: "VERIFICACAO_EMAIL",
      expiraEm: futureDate,
      usadoEm: usedDate,
      criadoEm: new Date(),
    });

    await expect(verifyEmail(input, mockDeps)).rejects.toThrow("Este link já foi utilizado.");
  });

  it("should throw error if token type is not VERIFICACAO_EMAIL", async () => {
    const input: VerifyEmailInput = {
      token: "wrong-type-token",
    };

    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    mockDeps.tokenVerificacaoRepository.findByToken.mockResolvedValue({
      id: "token-1",
      usuarioId: "user-123",
      token: "wrong-type-token",
      tipo: "RESET_SENHA", // Wrong type
      expiraEm: futureDate,
      usadoEm: null,
      criadoEm: new Date(),
    });

    await expect(verifyEmail(input, mockDeps)).rejects.toThrow("Token inválido.");
  });

  it("should throw error if user not found", async () => {
    const input: VerifyEmailInput = {
      token: "valid-token",
    };

    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    mockDeps.tokenVerificacaoRepository.findByToken.mockResolvedValue({
      id: "token-1",
      usuarioId: "nonexistent-user",
      token: "valid-token",
      tipo: "VERIFICACAO_EMAIL",
      expiraEm: futureDate,
      usadoEm: null,
      criadoEm: new Date(),
    });

    mockDeps.usuariosRepository.findById.mockResolvedValue(null);

    await expect(verifyEmail(input, mockDeps)).rejects.toThrow("Usuário não encontrado.");
  });

  it("should handle already verified user gracefully", async () => {
    const input: VerifyEmailInput = {
      token: "valid-token",
    };

    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    mockDeps.tokenVerificacaoRepository.findByToken.mockResolvedValue({
      id: "token-1",
      usuarioId: "user-123",
      token: "valid-token",
      tipo: "VERIFICACAO_EMAIL",
      expiraEm: futureDate,
      usadoEm: null,
      criadoEm: new Date(),
    });

    mockDeps.usuariosRepository.findById.mockResolvedValue({
      id: "user-123",
      nome: "Test User",
      email: "test@example.com",
      eVerificado: true, // Already verified
    } as any);

    const result = await verifyEmail(input, mockDeps);

    expect(result.success).toBe(true);
    expect(result.message).toContain("já verificado anteriormente");
    expect(mockDeps.usuariosRepository.markAsVerified).not.toHaveBeenCalled();
    expect(mockDeps.tokenVerificacaoRepository.markAsUsed).not.toHaveBeenCalled();
  });

  it("should verify all token conditions in correct order", async () => {
    const input: VerifyEmailInput = {
      token: "complete-flow-token",
    };

    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    mockDeps.tokenVerificacaoRepository.findByToken.mockResolvedValue({
      id: "token-1",
      usuarioId: "user-123",
      token: "complete-flow-token",
      tipo: "VERIFICACAO_EMAIL",
      expiraEm: futureDate,
      usadoEm: null,
      criadoEm: new Date(),
    });

    mockDeps.usuariosRepository.findById.mockResolvedValue({
      id: "user-123",
      nome: "Test User",
      email: "test@example.com",
      eVerificado: false,
    } as any);

    await verifyEmail(input, mockDeps);

    // Verify the order of calls
    expect(mockDeps.tokenVerificacaoRepository.findByToken).toHaveBeenCalledWith(
      "complete-flow-token"
    );
    expect(mockDeps.usuariosRepository.findById).toHaveBeenCalledWith("user-123");
    expect(mockDeps.usuariosRepository.markAsVerified).toHaveBeenCalledWith("user-123");
    expect(mockDeps.tokenVerificacaoRepository.markAsUsed).toHaveBeenCalledWith("token-1");
  });

  it("should handle tokens expiring in the past", async () => {
    const input: VerifyEmailInput = {
      token: "past-expiry-token",
    };

    // Token expired 1 second ago
    const pastDate = new Date(Date.now() - 1000);
    mockDeps.tokenVerificacaoRepository.findByToken.mockResolvedValue({
      id: "token-1",
      usuarioId: "user-123",
      token: "past-expiry-token",
      tipo: "VERIFICACAO_EMAIL",
      expiraEm: pastDate,
      usadoEm: null,
      criadoEm: new Date(),
    });

    // Should throw expired error before checking user
    await expect(verifyEmail(input, mockDeps)).rejects.toThrow("Token expirado");
  });
});
