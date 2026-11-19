import { resetPassword } from "../reset-password";
import type { IUsuariosRepository } from "@/lib/server/db/interfaces/usuarios-repository.interface";
import type { ITokenVerificacaoRepository } from "@/lib/server/db/interfaces/token-verificacao-repository.interface";
import type { TokenVerificacao } from "@/lib/server/db/interfaces/types";

// Mock bcryptjs to avoid slow hashing in tests
jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("new-hashed-password"),
}));

function makeToken(overrides: Partial<TokenVerificacao> = {}): TokenVerificacao {
  return {
    id: "token-1",
    usuarioId: "user-1",
    token: "reset-token",
    tipo: "RESET_SENHA",
    expiraEm: new Date(Date.now() + 60 * 60 * 1000), // 1h from now
    usadoEm: null,
    criadoEm: new Date(),
    ...overrides,
  } as TokenVerificacao;
}

function makeDeps(tokenData: TokenVerificacao | null = makeToken(), consumed = true) {
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
      resetPasswordWithToken: jest.fn().mockResolvedValue(consumed),
    } as unknown as IUsuariosRepository,
  };
}

describe("resetPassword", () => {
  it("resets password successfully with valid token", async () => {
    const deps = makeDeps();

    const result = await resetPassword(
      { token: "reset-token", novaSenha: "new-strong-password" },
      deps
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain("Senha redefinida com sucesso");
    expect(deps.usuariosRepository.resetPasswordWithToken).toHaveBeenCalledWith(
      "user-1",
      "token-1",
      "new-hashed-password"
    );
  });

  it("throws when password is too short", async () => {
    const deps = makeDeps();

    await expect(resetPassword({ token: "reset-token", novaSenha: "short" }, deps)).rejects.toThrow(
      "pelo menos 8 caracteres"
    );
  });

  it("throws when password is too long", async () => {
    const deps = makeDeps();
    const longPassword = "a".repeat(129);

    await expect(
      resetPassword({ token: "reset-token", novaSenha: longPassword }, deps)
    ).rejects.toThrow("no máximo 128 caracteres");
  });

  it("throws when token is not found", async () => {
    const deps = makeDeps(null);

    await expect(
      resetPassword({ token: "bad-token", novaSenha: "valid-password-123" }, deps)
    ).rejects.toThrow("Token inválido ou expirado");
  });

  it("throws when token is expired", async () => {
    const expiredToken = makeToken({ expiraEm: new Date(Date.now() - 1000) });
    const deps = makeDeps(expiredToken);

    await expect(
      resetPassword({ token: "reset-token", novaSenha: "valid-password-123" }, deps)
    ).rejects.toThrow("Token expirado");
  });

  it("throws when token was already used", async () => {
    const usedToken = makeToken({ usadoEm: new Date() });
    const deps = makeDeps(usedToken);

    await expect(
      resetPassword({ token: "reset-token", novaSenha: "valid-password-123" }, deps)
    ).rejects.toThrow("Este link já foi utilizado");
  });

  it("throws when token type is not RESET_SENHA", async () => {
    const wrongToken = makeToken({ tipo: "VERIFICACAO_EMAIL" as TokenVerificacao["tipo"] });
    const deps = makeDeps(wrongToken);

    await expect(
      resetPassword({ token: "reset-token", novaSenha: "valid-password-123" }, deps)
    ).rejects.toThrow("Token inválido");
  });

  it("rejects a reset link that was consumed while hashing the password", async () => {
    const deps = makeDeps(makeToken(), false);

    await expect(
      resetPassword({ token: "reset-token", novaSenha: "valid-password-123" }, deps)
    ).rejects.toThrow("Token inválido ou expirado");
  });
});
