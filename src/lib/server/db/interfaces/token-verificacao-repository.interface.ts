import type { TokenVerificacao, TokenVerificacaoCreateInput, TipoToken } from "./types";

export type ITokenVerificacaoRepository = {
  /**
   * Create a new verification token
   */
  create(data: TokenVerificacaoCreateInput): Promise<TokenVerificacao>;

  /**
   * Find a token by its value
   */
  findByToken(token: string): Promise<TokenVerificacao | null>;

  /**
   * Find the latest token for a user of a specific type
   */
  findLatestByUsuarioIdAndTipo(
    usuarioId: string,
    tipo: TipoToken
  ): Promise<TokenVerificacao | null>;

  /**
   * Mark a token as used
   */
  markAsUsed(id: string): Promise<void>;

  /**
   * Delete all expired tokens (cleanup)
   */
  deleteExpiredTokens(): Promise<number>;

  /**
   * Delete all tokens for a user of a specific type
   */
  deleteByUsuarioIdAndTipo(usuarioId: string, tipo: TipoToken): Promise<void>;
};
