import { ITokenVerificacaoRepository } from '@/domain/usuarios/repositories/ITokenVerificacaoRepository';
import { TokenVerificacao } from '@/domain/usuarios/entities/TokenVerificacao';
import { TipoToken } from '@prisma/client';
import { prisma } from '..';
import { logger } from '@/infra/logger';

const log = logger.child('repository:token-verificacao');

export class PrismaTokenVerificacaoRepository implements ITokenVerificacaoRepository {
  async create(token: TokenVerificacao): Promise<void> {
    log.debug('Criando token de verificação', {
      usuarioId: token.usuarioId,
      tipo: token.tipo,
    });

    await prisma.tokenVerificacao.create({
      data: {
        id: token.id,
        usuarioId: token.usuarioId,
        token: token.token,
        tipo: token.tipo,
        expiraEm: token.expiraEm,
      },
    });

    log.info('Token de verificação criado', { id: token.id, tipo: token.tipo });
  }

  async findByToken(token: string): Promise<TokenVerificacao | null> {
    log.debug('Buscando token', { token: token.substring(0, 8) + '...' });

    const tokenData = await prisma.tokenVerificacao.findUnique({
      where: { token },
    });

    if (!tokenData) {
      log.debug('Token não encontrado');
      return null;
    }

    return TokenVerificacao.create(
      {
        usuarioId: tokenData.usuarioId,
        token: tokenData.token,
        tipo: tokenData.tipo,
        expiraEm: tokenData.expiraEm,
        usadoEm: tokenData.usadoEm,
        criadoEm: tokenData.criadoEm,
      },
      tokenData.id
    );
  }

  async findLatestByUsuarioIdAndTipo(
    usuarioId: string,
    tipo: TipoToken
  ): Promise<TokenVerificacao | null> {
    log.debug('Buscando último token por usuário e tipo', { usuarioId, tipo });

    const tokenData = await prisma.tokenVerificacao.findFirst({
      where: { usuarioId, tipo },
      orderBy: { criadoEm: 'desc' },
    });

    if (!tokenData) {
      return null;
    }

    return TokenVerificacao.create(
      {
        usuarioId: tokenData.usuarioId,
        token: tokenData.token,
        tipo: tokenData.tipo,
        expiraEm: tokenData.expiraEm,
        usadoEm: tokenData.usadoEm,
        criadoEm: tokenData.criadoEm,
      },
      tokenData.id
    );
  }

  async markAsUsed(id: string): Promise<void> {
    log.debug('Marcando token como usado', { id });

    await prisma.tokenVerificacao.update({
      where: { id },
      data: { usadoEm: new Date() },
    });

    log.info('Token marcado como usado', { id });
  }

  async deleteExpiredTokens(): Promise<number> {
    log.debug('Removendo tokens expirados');

    const result = await prisma.tokenVerificacao.deleteMany({
      where: {
        expiraEm: { lt: new Date() },
      },
    });

    if (result.count > 0) {
      log.info('Tokens expirados removidos', { count: result.count });
    }

    return result.count;
  }

  async deleteByUsuarioIdAndTipo(usuarioId: string, tipo: TipoToken): Promise<void> {
    log.debug('Removendo tokens do usuário', { usuarioId, tipo });

    await prisma.tokenVerificacao.deleteMany({
      where: { usuarioId, tipo },
    });

    log.info('Tokens do usuário removidos', { usuarioId, tipo });
  }
}

