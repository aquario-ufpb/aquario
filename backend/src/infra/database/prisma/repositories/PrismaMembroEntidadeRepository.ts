import {
  IMembroEntidadeRepository,
  MembroComUsuario,
} from '@/domain/entidades/repositories/IMembroEntidadeRepository';
import { prisma } from '..';
import { logger } from '@/infra/logger';

const log = logger.child('repository:membros-entidade');

export class PrismaMembroEntidadeRepository implements IMembroEntidadeRepository {
  async findManyByEntidadeId(entidadeId: string): Promise<MembroComUsuario[]> {
    log.debug('Listando membros por entidade', { entidadeId });

    const membros = await prisma.membroEntidade.findMany({
      where: { entidadeId },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            urlFotoPerfil: true,
            curso: true,
          },
        },
      },
    });

    log.info('Membros carregados para entidade', { entidadeId, quantidade: membros.length });
    return membros.map(membro => ({
      id: membro.id,
      papel: membro.papel,
      usuario: {
        id: membro.usuario.id,
        nome: membro.usuario.nome,
        urlFotoPerfil: membro.usuario.urlFotoPerfil,
        curso: membro.usuario.curso,
      },
    }));
  }
}
