import type { ITokenVerificacaoRepository } from "@/lib/server/db/interfaces/token-verificacao-repository.interface";
import type { TokenVerificacao, TokenVerificacaoCreateInput, TipoToken } from "@/lib/server/db/interfaces/types";
import { randomUUID } from "crypto";

export class InMemoryTokenVerificacaoRepository implements ITokenVerificacaoRepository {
  private tokens: TokenVerificacao[] = [];

  async create(data: TokenVerificacaoCreateInput): Promise<TokenVerificacao> {
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
    return token;
  }

  async findByToken(token: string): Promise<TokenVerificacao | null> {
    return this.tokens.find((t) => t.token === token) ?? null;
  }

  async findLatestByUsuarioIdAndTipo(
    usuarioId: string,
    tipo: TipoToken
  ): Promise<TokenVerificacao | null> {
    const userTokens = this.tokens
      .filter((t) => t.usuarioId === usuarioId && t.tipo === tipo)
      .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());

    return userTokens[0] ?? null;
  }

  async markAsUsed(id: string): Promise<void> {
    const token = this.tokens.find((t) => t.id === id);
    if (token) {
      token.usadoEm = new Date();
    }
  }

  async deleteExpiredTokens(): Promise<number> {
    const now = new Date();
    const initialLength = this.tokens.length;
    this.tokens = this.tokens.filter((t) => t.expiraEm > now);
    return initialLength - this.tokens.length;
  }

  async deleteByUsuarioIdAndTipo(usuarioId: string, tipo: TipoToken): Promise<void> {
    this.tokens = this.tokens.filter(
      (t) => !(t.usuarioId === usuarioId && t.tipo === tipo)
    );
  }

  // Helper for testing
  clear(): void {
    this.tokens = [];
  }
}

