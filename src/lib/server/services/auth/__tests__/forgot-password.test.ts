import { forgotPassword } from "../forgot-password";
import type { IUsuariosRepository } from "@/lib/server/db/interfaces/usuarios-repository.interface";
import type { ITokenVerificacaoRepository } from "@/lib/server/db/interfaces/token-verificacao-repository.interface";
import type { IEmailService } from "@/lib/server/services/email/email-service.interface";
import type { TokenVerificacao, UsuarioWithRelations } from "@/lib/server/db/interfaces/types";

function makeUsuario(overrides: Partial<UsuarioWithRelations> = {}): UsuarioWithRelations {
  return {
    id: "user-1",
    nome: "Test User",
    email: "test@academico.ufpb.br",
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
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      sendVerificationEmail: jest.fn(),
    } as IEmailService,
  };
}

describe("forgotPassword", () => {
  it("always returns success message (enumeration prevention)", async () => {
    const deps = makeDeps();
    const result = await forgotPassword({ email: "test@academico.ufpb.br" }, deps);

    expect(result.success).toBe(true);
    expect(result.message).toContain("Se o email estiver cadastrado");
  });

  it("returns success even when user does not exist", async () => {
    const deps = makeDeps(null);
    const result = await forgotPassword({ email: "nonexistent@academico.ufpb.br" }, deps);

    expect(result.success).toBe(true);
    expect(deps.tokenVerificacaoRepository.create).not.toHaveBeenCalled();
    expect(deps.emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("normalizes email to lowercase and trims", async () => {
    const deps = makeDeps();
    await forgotPassword({ email: "  TEST@ACADEMICO.UFPB.BR  " }, deps);

    expect(deps.usuariosRepository.findByEmail).toHaveBeenCalledWith("test@academico.ufpb.br");
  });

  it("creates token and sends email for valid user", async () => {
    const deps = makeDeps();
    await forgotPassword({ email: "test@academico.ufpb.br" }, deps);

    expect(deps.tokenVerificacaoRepository.deleteByUsuarioIdAndTipo).toHaveBeenCalledWith(
      "user-1",
      "RESET_SENHA"
    );
    expect(deps.tokenVerificacaoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: "user-1",
        tipo: "RESET_SENHA",
        token: expect.any(String),
        expiraEm: expect.any(Date),
      })
    );
    expect(deps.emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      "test@academico.ufpb.br",
      expect.any(String),
      "Test User"
    );
  });

  it("rate limits - skips if last token was created less than 1 minute ago", async () => {
    const recentToken = {
      id: "recent-token",
      criadoEm: new Date(), // just now
    } as TokenVerificacao;
    const deps = makeDeps(makeUsuario(), recentToken);

    const result = await forgotPassword({ email: "test@academico.ufpb.br" }, deps);

    expect(result.success).toBe(true);
    expect(deps.tokenVerificacaoRepository.create).not.toHaveBeenCalled();
    expect(deps.emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("allows request if last token was created more than 1 minute ago", async () => {
    const oldToken = {
      id: "old-token",
      criadoEm: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago
    } as TokenVerificacao;
    const deps = makeDeps(makeUsuario(), oldToken);

    await forgotPassword({ email: "test@academico.ufpb.br" }, deps);

    expect(deps.tokenVerificacaoRepository.create).toHaveBeenCalled();
  });

  it("returns success even when email sending fails", async () => {
    const deps = makeDeps();
    (deps.emailService.sendPasswordResetEmail as jest.Mock).mockRejectedValue(
      new Error("SMTP error")
    );

    const result = await forgotPassword({ email: "test@academico.ufpb.br" }, deps);

    expect(result.success).toBe(true);
  });

  it("returns success when user has no email", async () => {
    const noEmailUser = makeUsuario({ email: null });
    const deps = makeDeps(noEmailUser);

    const result = await forgotPassword({ email: "test@academico.ufpb.br" }, deps);

    expect(result.success).toBe(true);
    expect(deps.tokenVerificacaoRepository.create).not.toHaveBeenCalled();
  });
});
