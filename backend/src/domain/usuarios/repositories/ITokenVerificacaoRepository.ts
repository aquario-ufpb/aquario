import { TokenVerificacao } from '../entities/TokenVerificacao';
import { TipoToken } from '@prisma/client';

export interface ITokenVerificacaoRepository {
  /**
   * Create a new token
   */
  create(token: TokenVerificacao): Promise<void>;

  /**
   * Find a token by its value
   */
  findByToken(token: string): Promise<TokenVerificacao | null>;

  /**
   * Find the latest token for a user of a specific type
   */
  findLatestByUsuarioIdAndTipo(usuarioId: string, tipo: TipoToken): Promise<TokenVerificacao | null>;

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
   * Useful when generating new token to invalidate previous ones
   */
  deleteByUsuarioIdAndTipo(usuarioId: string, tipo: TipoToken): Promise<void>;
}

