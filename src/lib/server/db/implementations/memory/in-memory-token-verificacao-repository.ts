import type { ITokenVerificacaoRepository } from "@/lib/server/db/interfaces/token-verificacao-repository.interface";
import type {
  TokenVerificacao,
  TokenVerificacaoCreateInput,
  TipoToken,
} from "@/lib/server/db/interfaces/types";
import { randomUUID } from "crypto";

export class InMemoryTokenVerificacaoRepository implements ITokenVerificacaoRepository {
  private tokens: TokenVerificacao[] = [];

  create(data: TokenVerificacaoCreateInput): Promise<TokenVerificacao> {
    const token: TokenVerificacao = {
      id: randomUUID(),
      usuarioId: data.usuarioId,
      token: data.token,
      tipo: data.tipo,
      expiraEm: data.expiraEm,
      usadoEm: null,
      criadoEm: new Date(),
    };

    this.tokens.push(token);
    return Promise.resolve(token);
  }

  findByToken(token: string): Promise<TokenVerificacao | null> {
    return Promise.resolve(this.tokens.find(t => t.token === token) ?? null);
  }

  findLatestByUsuarioIdAndTipo(
    usuarioId: string,
    tipo: TipoToken
  ): Promise<TokenVerificacao | null> {
    const userTokens = this.tokens
      .filter(t => t.usuarioId === usuarioId && t.tipo === tipo)
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());

    return Promise.resolve(userTokens[0] ?? null);
  }

  markAsUsed(id: string): Promise<void> {
    const token = this.tokens.find(t => t.id === id);
    if (token) {
      token.usadoEm = new Date();
    }
    return Promise.resolve();
  }

  deleteExpiredTokens(): Promise<number> {
    const now = new Date();
    const initialLength = this.tokens.length;
    this.tokens = this.tokens.filter(t => t.expiraEm > now);
    return Promise.resolve(initialLength - this.tokens.length);
  }

  deleteByUsuarioIdAndTipo(usuarioId: string, tipo: TipoToken): Promise<void> {
    this.tokens = this.tokens.filter(t => !(t.usuarioId === usuarioId && t.tipo === tipo));
    return Promise.resolve();
  }

  // Helper for testing
  clear(): void {
    this.tokens = [];
  }
}
