import {
  forgotPassword,
  type ForgotPasswordInput,
  type ForgotPasswordDependencies,
} from "../forgot-password";

describe("forgotPassword", () => {
  let mockDeps: jest.Mocked<ForgotPasswordDependencies>;

  beforeEach(() => {
    mockDeps = {
      usuariosRepository: {
        findByEmail: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        list: jest.fn(),
        count: jest.fn(),
      } as any,
      tokenVerificacaoRepository: {
        findLatestByUsuarioIdAndTipo: jest.fn(),
        deleteByUsuarioIdAndTipo: jest.fn(),
        create: jest.fn(),
        findByToken: jest.fn(),
        markAsUsed: jest.fn(),
        deleteByUsuarioId: jest.fn(),
        deleteExpired: jest.fn(),
      } as any,
      emailService: {
        sendPasswordResetEmail: jest.fn(),
        sendVerificationEmail: jest.fn(),
      } as any,
    };

    jest.clearAllMocks();
  });

  it("should successfully send password reset email for valid user", async () => {
    const input: ForgotPasswordInput = {
      email: "test@example.com",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue({
      id: "user-123",
      nome: "Test User",
      email: "test@example.com",
    } as any);

    mockDeps.tokenVerificacaoRepository.findLatestByUsuarioIdAndTipo.mockResolvedValue(null);
    mockDeps.emailService.sendPasswordResetEmail.mockResolvedValue(undefined);

    const result = await forgotPassword(input, mockDeps);

    expect(result.success).toBe(true);
    expect(result.message).toContain("receberá um link");
    expect(mockDeps.tokenVerificacaoRepository.deleteByUsuarioIdAndTipo).toHaveBeenCalledWith(
      "user-123",
      "RESET_SENHA"
    );
    expect(mockDeps.tokenVerificacaoRepository.create).toHaveBeenCalled();
    expect(mockDeps.emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      "test@example.com",
      expect.any(String),
      "Test User"
    );
  });

  it("should normalize email to lowercase and trim whitespace", async () => {
    const input: ForgotPasswordInput = {
      email: "  TEST@EXAMPLE.COM  ",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue({
      id: "user-123",
      nome: "Test User",
      email: "test@example.com",
    } as any);

    mockDeps.tokenVerificacaoRepository.findLatestByUsuarioIdAndTipo.mockResolvedValue(null);

    await forgotPassword(input, mockDeps);

    expect(mockDeps.usuariosRepository.findByEmail).toHaveBeenCalledWith("test@example.com");
  });

  it("should return success even if email not found (prevents enumeration)", async () => {
    const input: ForgotPasswordInput = {
      email: "nonexistent@example.com",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue(null);

    const result = await forgotPassword(input, mockDeps);

    expect(result.success).toBe(true);
    expect(result.message).toContain("receberá um link");
    expect(mockDeps.tokenVerificacaoRepository.create).not.toHaveBeenCalled();
    expect(mockDeps.emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("should return success if user has no email (prevents enumeration)", async () => {
    const input: ForgotPasswordInput = {
      email: "test@example.com",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue({
      id: "user-123",
      nome: "Test User",
      email: null, // No email
    } as any);

    const result = await forgotPassword(input, mockDeps);

    expect(result.success).toBe(true);
    expect(mockDeps.tokenVerificacaoRepository.create).not.toHaveBeenCalled();
    expect(mockDeps.emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("should implement rate limiting - reject if token created less than 1 minute ago", async () => {
    const input: ForgotPasswordInput = {
      email: "test@example.com",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue({
      id: "user-123",
      nome: "Test User",
      email: "test@example.com",
    } as any);

    // Recent token created 30 seconds ago
    const recentToken = {
      id: "token-1",
      usuarioId: "user-123",
      tipo: "RESET_SENHA" as const,
      criadoEm: new Date(Date.now() - 30 * 1000),
    };
    mockDeps.tokenVerificacaoRepository.findLatestByUsuarioIdAndTipo.mockResolvedValue(recentToken);

    const result = await forgotPassword(input, mockDeps);

    // Still returns success (prevents timing attacks)
    expect(result.success).toBe(true);
    // But doesn't create new token or send email
    expect(mockDeps.tokenVerificacaoRepository.create).not.toHaveBeenCalled();
    expect(mockDeps.emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("should allow new token if last token was created more than 1 minute ago", async () => {
    const input: ForgotPasswordInput = {
      email: "test@example.com",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue({
      id: "user-123",
      nome: "Test User",
      email: "test@example.com",
    } as any);

    // Old token created 2 minutes ago
    const oldToken = {
      id: "token-1",
      usuarioId: "user-123",
      tipo: "RESET_SENHA" as const,
      criadoEm: new Date(Date.now() - 2 * 60 * 1000),
    };
    mockDeps.tokenVerificacaoRepository.findLatestByUsuarioIdAndTipo.mockResolvedValue(oldToken);

    const result = await forgotPassword(input, mockDeps);

    expect(result.success).toBe(true);
    expect(mockDeps.tokenVerificacaoRepository.create).toHaveBeenCalled();
    expect(mockDeps.emailService.sendPasswordResetEmail).toHaveBeenCalled();
  });

  it("should delete old reset tokens before creating new one", async () => {
    const input: ForgotPasswordInput = {
      email: "test@example.com",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue({
      id: "user-123",
      nome: "Test User",
      email: "test@example.com",
    } as any);

    mockDeps.tokenVerificacaoRepository.findLatestByUsuarioIdAndTipo.mockResolvedValue(null);

    await forgotPassword(input, mockDeps);

    expect(mockDeps.tokenVerificacaoRepository.deleteByUsuarioIdAndTipo).toHaveBeenCalledWith(
      "user-123",
      "RESET_SENHA"
    );
  });

  it("should create token with 1 hour expiration", async () => {
    const input: ForgotPasswordInput = {
      email: "test@example.com",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue({
      id: "user-123",
      nome: "Test User",
      email: "test@example.com",
    } as any);

    mockDeps.tokenVerificacaoRepository.findLatestByUsuarioIdAndTipo.mockResolvedValue(null);

    const beforeTime = new Date(Date.now() + 60 * 60 * 1000 - 1000);
    await forgotPassword(input, mockDeps);
    const afterTime = new Date(Date.now() + 60 * 60 * 1000 + 1000);

    expect(mockDeps.tokenVerificacaoRepository.create).toHaveBeenCalled();
    const createCall = mockDeps.tokenVerificacaoRepository.create.mock.calls[0][0];
    expect(createCall.usuarioId).toBe("user-123");
    expect(createCall.tipo).toBe("RESET_SENHA");
    expect(createCall.token).toHaveLength(64); // 32 bytes hex = 64 chars
    expect(createCall.expiraEm.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(createCall.expiraEm.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });

  it("should still return success if email sending fails (prevents leakage)", async () => {
    const input: ForgotPasswordInput = {
      email: "test@example.com",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue({
      id: "user-123",
      nome: "Test User",
      email: "test@example.com",
    } as any);

    mockDeps.tokenVerificacaoRepository.findLatestByUsuarioIdAndTipo.mockResolvedValue(null);
    mockDeps.emailService.sendPasswordResetEmail.mockRejectedValue(
      new Error("Email service error")
    );

    const result = await forgotPassword(input, mockDeps);

    expect(result.success).toBe(true);
    expect(result.message).toContain("receberá um link");
  });

  it("should generate unique tokens for different requests", async () => {
    const input: ForgotPasswordInput = {
      email: "test@example.com",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue({
      id: "user-123",
      nome: "Test User",
      email: "test@example.com",
    } as any);

    mockDeps.tokenVerificacaoRepository.findLatestByUsuarioIdAndTipo.mockResolvedValue(null);

    await forgotPassword(input, mockDeps);
    const firstToken = mockDeps.tokenVerificacaoRepository.create.mock.calls[0][0].token;

    await forgotPassword(input, mockDeps);
    const secondToken = mockDeps.tokenVerificacaoRepository.create.mock.calls[1][0].token;

    expect(firstToken).not.toBe(secondToken);
  });

  it("should handle missing criadoEm in last token gracefully", async () => {
    const input: ForgotPasswordInput = {
      email: "test@example.com",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue({
      id: "user-123",
      nome: "Test User",
      email: "test@example.com",
    } as any);

    // Token without criadoEm
    const tokenWithoutDate = {
      id: "token-1",
      usuarioId: "user-123",
      tipo: "RESET_SENHA" as const,
      criadoEm: null,
    };
    mockDeps.tokenVerificacaoRepository.findLatestByUsuarioIdAndTipo.mockResolvedValue(
      tokenWithoutDate as any
    );

    const result = await forgotPassword(input, mockDeps);

    // Should still work and create new token
    expect(result.success).toBe(true);
    expect(mockDeps.tokenVerificacaoRepository.create).toHaveBeenCalled();
  });
});
