import { prisma } from "@/lib/server/db/prisma";
import type { ITokenVerificacaoRepository } from "@/lib/server/db/interfaces/token-verificacao-repository.interface";
import type { TokenVerificacao, TokenVerificacaoCreateInput, TipoToken } from "@/lib/server/db/interfaces/types";

export class PrismaTokenVerificacaoRepository implements ITokenVerificacaoRepository {
  async create(data: TokenVerificacaoCreateInput): Promise<TokenVerificacao> {
    const token = await prisma.tokenVerificacao.create({
      data: {
        usuarioId: data.usuarioId,
        token: data.token,
        tipo: data.tipo,
        expiraEm: data.expiraEm,
      },
    });

    return token;
  }

  async findByToken(token: string): Promise<TokenVerificacao | null> {
    const tokenData = await prisma.tokenVerificacao.findUnique({
      where: { token },
    });

    return tokenData;
  }

  async findLatestByUsuarioIdAndTipo(
    usuarioId: string,
    tipo: TipoToken
  ): Promise<TokenVerificacao | null> {
    const tokenData = await prisma.tokenVerificacao.findFirst({
      where: { usuarioId, tipo },
      orderBy: { criadoEm: "desc" },
    });

    return tokenData;
  }

  async markAsUsed(id: string): Promise<void> {
    await prisma.tokenVerificacao.update({
      where: { id },
      data: { usadoEm: new Date() },
    });
  }

  async deleteExpiredTokens(): Promise<number> {
    const result = await prisma.tokenVerificacao.deleteMany({
      where: {
        expiraEm: { lt: new Date() },
      },
    });

    return result.count;
  }

  async deleteByUsuarioIdAndTipo(usuarioId: string, tipo: TipoToken): Promise<void> {
    await prisma.tokenVerificacao.deleteMany({
      where: { usuarioId, tipo },
    });
  }
}

