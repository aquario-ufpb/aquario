import { verifyEmail } from "../verify-email";
import type { IUsuariosRepository } from "@/lib/server/db/interfaces/usuarios-repository.interface";
import type { ITokenVerificacaoRepository } from "@/lib/server/db/interfaces/token-verificacao-repository.interface";
import type { TokenVerificacao, UsuarioWithRelations } from "@/lib/server/db/interfaces/types";

function makeToken(overrides: Partial<TokenVerificacao> = {}): TokenVerificacao {
  return {
    id: "token-1",
    usuarioId: "user-1",
    token: "valid-token",
    tipo: "VERIFICACAO_EMAIL",
    expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
    usadoEm: null,
    criadoEm: new Date(),
    ...overrides,
  } as TokenVerificacao;
}

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
  tokenData: TokenVerificacao | null = makeToken(),
  usuario: UsuarioWithRelations | null = makeUsuario()
) {
  return {
    tokenVerificacaoRepository: {
      findByToken: jest.fn().mockResolvedValue(tokenData),
      markAsUsed: jest.fn().mockResolvedValue(undefined),
      create: jest.fn(),
      findLatestByUsuarioIdAndTipo: jest.fn(),
      deleteExpiredTokens: jest.fn(),
      deleteByUsuarioIdAndTipo: jest.fn(),
    } as unknown as ITokenVerificacaoRepository,
    usuariosRepository: {
      findById: jest.fn().mockResolvedValue(usuario),
      markAsVerified: jest.fn().mockResolvedValue(undefined),
    } as unknown as IUsuariosRepository,
  };
}

describe("verifyEmail", () => {
  it("verifies email successfully with valid token", async () => {
    const deps = makeDeps();

    const result = await verifyEmail({ token: "valid-token" }, deps);

    expect(result.success).toBe(true);
    expect(result.message).toContain("verificado com sucesso");
    expect(deps.usuariosRepository.markAsVerified).toHaveBeenCalledWith("user-1");
    expect(deps.tokenVerificacaoRepository.markAsUsed).toHaveBeenCalledWith("token-1");
  });

  it("throws when token is not found", async () => {
    const deps = makeDeps(null);

    await expect(verifyEmail({ token: "bad-token" }, deps)).rejects.toThrow(
      "Token inválido ou expirado"
    );
  });

  it("throws when token is expired", async () => {
    const expiredToken = makeToken({ expiraEm: new Date(Date.now() - 1000) });
    const deps = makeDeps(expiredToken);

    await expect(verifyEmail({ token: "valid-token" }, deps)).rejects.toThrow("Token expirado");
  });

  it("throws when token was already used", async () => {
    const usedToken = makeToken({ usadoEm: new Date() });
    const deps = makeDeps(usedToken);

    await expect(verifyEmail({ token: "valid-token" }, deps)).rejects.toThrow(
      "Este link já foi utilizado"
    );
  });

  it("throws when token type is not VERIFICACAO_EMAIL", async () => {
    const wrongTypeToken = makeToken({ tipo: "RESET_SENHA" as TokenVerificacao["tipo"] });
    const deps = makeDeps(wrongTypeToken);

    await expect(verifyEmail({ token: "valid-token" }, deps)).rejects.toThrow("Token inválido");
  });

  it("throws when user is not found", async () => {
    const deps = makeDeps(makeToken(), null);

    await expect(verifyEmail({ token: "valid-token" }, deps)).rejects.toThrow(
      "Usuário não encontrado"
    );
  });

  it("returns success without re-verifying if already verified", async () => {
    const verifiedUser = makeUsuario({ eVerificado: true });
    const deps = makeDeps(makeToken(), verifiedUser);

    const result = await verifyEmail({ token: "valid-token" }, deps);

    expect(result.success).toBe(true);
    expect(result.message).toContain("já verificado");
    expect(deps.usuariosRepository.markAsVerified).not.toHaveBeenCalled();
  });
});
