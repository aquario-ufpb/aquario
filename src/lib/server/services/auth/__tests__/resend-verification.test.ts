import { resendVerificationByUser, resendVerificationByEmail } from "../resend-verification";
import type { IUsuariosRepository } from "@/lib/server/db/interfaces/usuarios-repository.interface";
import type { ITokenVerificacaoRepository } from "@/lib/server/db/interfaces/token-verificacao-repository.interface";
import type { IEmailService } from "@/lib/server/services/email/email-service.interface";
import type { TokenVerificacao, UsuarioWithRelations } from "@/lib/server/db/interfaces/types";

// Mock logger
jest.mock("@/lib/server/utils/logger", () => ({
  createLogger: () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn(), debug: jest.fn() }),
}));

function makeUsuario(overrides: Partial<UsuarioWithRelations> = {}): UsuarioWithRelations {
  return {
    id: "user-1",
    nome: "Test User",
    email: "test@academico.ufpb.br",
    eVerificado: false,
    centro: { id: "c1", nome: "CI", sigla: "CI", descricao: null, campusId: "campus-1" },
    curso: { id: "k1", nome: "CC", centroId: "c1", criadoEm: new Date(), atualizadoEm: new Date() },
    ...overrides,
  } as UsuarioWithRelations;
}

function makeDeps(
  usuario: UsuarioWithRelations | null = makeUsuario(),
  lastToken: TokenVerificacao | null = null
) {
  return {
    usuariosRepository: {
      findById: jest.fn().mockResolvedValue(usuario),
      findByEmail: jest.fn().mockResolvedValue(usuario),
    } as unknown as IUsuariosRepository,
    tokenVerificacaoRepository: {
      findLatestByUsuarioIdAndTipo: jest.fn().mockResolvedValue(lastToken),
      deleteByUsuarioIdAndTipo: jest.fn().mockResolvedValue(undefined),
      create: jest.fn().mockResolvedValue({ id: "new-token-id" }),
      findByToken: jest.fn(),
      markAsUsed: jest.fn(),
      deleteExpiredTokens: jest.fn(),
    } as unknown as ITokenVerificacaoRepository,
    emailService: {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn(),
    } as IEmailService,
  };
}

describe("resendVerificationByUser", () => {
  it("sends verification email for unverified user", async () => {
    const deps = makeDeps();

    const result = await resendVerificationByUser({ usuarioId: "user-1" }, deps);

    expect(result.success).toBe(true);
    expect(result.message).toContain("Email de verificação enviado");
    expect(deps.tokenVerificacaoRepository.deleteByUsuarioIdAndTipo).toHaveBeenCalledWith(
      "user-1",
      "VERIFICACAO_EMAIL"
    );
    expect(deps.tokenVerificacaoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: "user-1",
        tipo: "VERIFICACAO_EMAIL",
        token: expect.any(String),
        expiraEm: expect.any(Date),
      })
    );
    expect(deps.emailService.sendVerificationEmail).toHaveBeenCalled();
  });

  it("throws when user is not found", async () => {
    const deps = makeDeps(null);

    await expect(resendVerificationByUser({ usuarioId: "missing" }, deps)).rejects.toThrow(
      "Usuário não encontrado"
    );
  });

  it("throws when user has no email", async () => {
    const noEmailUser = makeUsuario({ email: null });
    const deps = makeDeps(noEmailUser);

    await expect(resendVerificationByUser({ usuarioId: "user-1" }, deps)).rejects.toThrow(
      "não possui email"
    );
  });

  it("returns early if already verified", async () => {
    const verifiedUser = makeUsuario({ eVerificado: true });
    const deps = makeDeps(verifiedUser);

    const result = await resendVerificationByUser({ usuarioId: "user-1" }, deps);

    expect(result.success).toBe(true);
    expect(result.message).toContain("já está verificado");
    expect(deps.emailService.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("rate limits - throws if last token was created less than 1 minute ago", async () => {
    const recentToken = { id: "t1", criadoEm: new Date() } as TokenVerificacao;
    const deps = makeDeps(makeUsuario(), recentToken);

    await expect(resendVerificationByUser({ usuarioId: "user-1" }, deps)).rejects.toThrow(
      "Aguarde pelo menos 1 minuto"
    );
  });

  it("allows resend if last token is older than 1 minute", async () => {
    const oldToken = {
      id: "t1",
      criadoEm: new Date(Date.now() - 2 * 60 * 1000),
    } as TokenVerificacao;
    const deps = makeDeps(makeUsuario(), oldToken);

    const result = await resendVerificationByUser({ usuarioId: "user-1" }, deps);

    expect(result.success).toBe(true);
    expect(deps.emailService.sendVerificationEmail).toHaveBeenCalled();
  });

  it("throws when email sending fails", async () => {
    const deps = makeDeps();
    (deps.emailService.sendVerificationEmail as jest.Mock).mockRejectedValue(
      new Error("SMTP error")
    );

    await expect(resendVerificationByUser({ usuarioId: "user-1" }, deps)).rejects.toThrow(
      "Falha ao enviar email"
    );
  });
});

describe("resendVerificationByEmail", () => {
  it("always returns success message (enumeration prevention)", async () => {
    const deps = makeDeps();
    const result = await resendVerificationByEmail({ email: "test@academico.ufpb.br" }, deps);

    expect(result.success).toBe(true);
    expect(result.message).toContain("Se o email estiver cadastrado");
  });

  it("returns success when user does not exist", async () => {
    const deps = makeDeps(null);
    const result = await resendVerificationByEmail({ email: "missing@academico.ufpb.br" }, deps);

    expect(result.success).toBe(true);
    expect(deps.tokenVerificacaoRepository.create).not.toHaveBeenCalled();
  });

  it("returns success when user is already verified (no email sent)", async () => {
    const verifiedUser = makeUsuario({ eVerificado: true });
    const deps = makeDeps(verifiedUser);

    const result = await resendVerificationByEmail({ email: "test@academico.ufpb.br" }, deps);

    expect(result.success).toBe(true);
    expect(deps.emailService.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("normalizes email to lowercase and trims", async () => {
    const deps = makeDeps();
    await resendVerificationByEmail({ email: "  TEST@ACADEMICO.UFPB.BR  " }, deps);

    expect(deps.usuariosRepository.findByEmail).toHaveBeenCalledWith("test@academico.ufpb.br");
  });

  it("rate limits silently - returns success without creating token", async () => {
    const recentToken = { id: "t1", criadoEm: new Date() } as TokenVerificacao;
    const deps = makeDeps(makeUsuario(), recentToken);

    const result = await resendVerificationByEmail({ email: "test@academico.ufpb.br" }, deps);

    expect(result.success).toBe(true);
    expect(deps.tokenVerificacaoRepository.create).not.toHaveBeenCalled();
  });

  it("sends email for valid unverified user", async () => {
    const deps = makeDeps();

    await resendVerificationByEmail({ email: "test@academico.ufpb.br" }, deps);

    expect(deps.tokenVerificacaoRepository.create).toHaveBeenCalled();
    expect(deps.emailService.sendVerificationEmail).toHaveBeenCalled();
  });

  it("returns success even when email sending fails", async () => {
    const deps = makeDeps();
    (deps.emailService.sendVerificationEmail as jest.Mock).mockRejectedValue(
      new Error("SMTP error")
    );

    const result = await resendVerificationByEmail({ email: "test@academico.ufpb.br" }, deps);

    expect(result.success).toBe(true);
  });
});
