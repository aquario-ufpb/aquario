import { IEntidadesRepository } from '@/domain/entidades/repositories/IEntidadesRepository';
import { Entidade } from '@/domain/entidades/entities/Entidade';
import { prisma } from '..';
import { logger } from '@/infra/logger';

const log = logger.child('repository:entidades');

export class PrismaEntidadesRepository implements IEntidadesRepository {
  async findById(id: string): Promise<Entidade | null> {
    log.debug('Buscando entidade por ID', { id });

    const entidade = await prisma.entidade.findUnique({
      where: { id },
      include: {
        membros: {
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
        },
        projetos: true,
        publicacoes: {
          include: {
            autor: true,
          },
        },
      },
    });

    if (!entidade) {
      log.warn('Entidade não encontrada', { id });
      return null;
    }

    return Entidade.create(
      {
        nome: entidade.nome,
        subtitle: entidade.subtitle,
        descricao: entidade.descricao,
        tipo: entidade.tipo,
        urlFoto: entidade.urlFoto,
        contato: entidade.contato,
        instagram: entidade.instagram,
        linkedin: entidade.linkedin,
        website: entidade.website,
        location: entidade.location,
        foundingDate: entidade.foundingDate,
        metadata: entidade.metadata as Record<string, unknown> | null,
        centroId: entidade.centroId,
        projetos: entidade.projetos as Record<string, unknown>[],
        publicacoes: entidade.publicacoes as Record<string, unknown>[],
      },
      entidade.id
    );
  }

  async findMany(): Promise<Entidade[]> {
    log.debug('Listando entidades');

    const entidades = await prisma.entidade.findMany({
      orderBy: {
        nome: 'asc',
      },
    });

    log.info('Entidades carregadas', { quantidade: entidades.length });

    return entidades.map(entidade =>
      Entidade.create(
        {
          nome: entidade.nome,
          subtitle: entidade.subtitle,
          descricao: entidade.descricao,
          tipo: entidade.tipo,
          urlFoto: entidade.urlFoto,
          contato: entidade.contato,
          instagram: entidade.instagram,
          linkedin: entidade.linkedin,
          website: entidade.website,
          location: entidade.location,
          foundingDate: entidade.foundingDate,
          metadata: entidade.metadata as Record<string, unknown> | null,
          centroId: entidade.centroId,
        },
        entidade.id
      )
    );
  }

  async update(id: string, data: Partial<Entidade['props']>): Promise<void> {
    log.debug('Atualizando entidade', { id, fields: Object.keys(data) });

    // Build update object with only provided fields (not undefined)
    const updateData: Record<string, unknown> = {};
    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.tipo !== undefined) updateData.tipo = data.tipo;
    if (data.urlFoto !== undefined) updateData.urlFoto = data.urlFoto;
    if (data.contato !== undefined) updateData.contato = data.contato;
    if (data.instagram !== undefined) updateData.instagram = data.instagram;
    if (data.linkedin !== undefined) updateData.linkedin = data.linkedin;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.foundingDate !== undefined) updateData.foundingDate = data.foundingDate;
    if (data.metadata !== undefined) updateData.metadata = data.metadata as unknown;
    if (data.centroId !== undefined) updateData.centroId = data.centroId;

    await prisma.entidade.update({
      where: { id },
      data: updateData,
    });

    log.info('Entidade atualizada com sucesso', { id });
  }
}
