import { prisma } from "@/lib/server/db/prisma";
import type {
  IMembrosRepository,
  MembroWithRelations,
  MembroWithEntidade,
  MembroRaw,
  CreateMembroInput,
  UpdateMembroInput,
} from "@/lib/server/db/interfaces/membros-repository.interface";

const membroInclude = {
  usuario: {
    include: {
      curso: true,
    },
  },
  cargo: true,
} as const;

const membroWithEntidadeInclude = {
  entidade: {
    include: {
      centro: true,
    },
  },
  cargo: true,
} as const;

export class PrismaMembrosRepository implements IMembrosRepository {
  async create(data: CreateMembroInput): Promise<MembroWithRelations> {
    const membro = await prisma.membroEntidade.create({
      data: {
        usuarioId: data.usuarioId,
        entidadeId: data.entidadeId,
        papel: data.papel,
        cargoId: data.cargoId || null,
        startedAt: data.startedAt || new Date(),
        endedAt: data.endedAt || null,
      },
      include: membroInclude,
    });

    return this.mapToMembroWithRelations(membro);
  }

  async findById(id: string): Promise<MembroWithRelations | null> {
    const membro = await prisma.membroEntidade.findUnique({
      where: { id },
      include: membroInclude,
    });

    return membro ? this.mapToMembroWithRelations(membro) : null;
  }

  async findByEntidadeAndMembro(
    entidadeId: string,
    membroId: string
  ): Promise<MembroWithRelations | null> {
    const membro = await prisma.membroEntidade.findFirst({
      where: {
        id: membroId,
        entidadeId,
      },
      include: membroInclude,
    });

    return membro ? this.mapToMembroWithRelations(membro) : null;
  }

  async findActiveByUsuarioAndEntidade(
    usuarioId: string,
    entidadeId: string
  ): Promise<MembroWithRelations | null> {
    const membro = await prisma.membroEntidade.findFirst({
      where: {
        usuarioId,
        entidadeId,
        endedAt: null,
      },
      include: membroInclude,
    });

    return membro ? this.mapToMembroWithRelations(membro) : null;
  }

  async findByUsuarioId(usuarioId: string): Promise<MembroWithEntidade[]> {
    const memberships = await prisma.membroEntidade.findMany({
      where: { usuarioId },
      include: membroWithEntidadeInclude,
      orderBy: { startedAt: "desc" },
    });

    return memberships.map(m => ({
      id: m.id,
      papel: m.papel,
      startedAt: m.startedAt,
      endedAt: m.endedAt,
      entidade: {
        id: m.entidade.id,
        nome: m.entidade.nome,
        slug: m.entidade.slug,
        tipo: m.entidade.tipo,
        urlFoto: m.entidade.urlFoto,
        centro: {
          id: m.entidade.centro.id,
          nome: m.entidade.centro.nome,
          sigla: m.entidade.centro.sigla,
        },
      },
      cargo: m.cargo
        ? {
            id: m.cargo.id,
            nome: m.cargo.nome,
            descricao: m.cargo.descricao,
            ordem: m.cargo.ordem,
          }
        : null,
    }));
  }

  async update(id: string, data: UpdateMembroInput): Promise<MembroWithRelations> {
    const updateData: Record<string, unknown> = {};

    if (data.papel !== undefined) {
      updateData.papel = data.papel;
    }
    if (data.cargoId !== undefined) {
      updateData.cargoId = data.cargoId;
    }
    if (data.startedAt !== undefined) {
      updateData.startedAt = data.startedAt;
    }
    if (data.endedAt !== undefined) {
      updateData.endedAt = data.endedAt;
    }

    const membro = await prisma.membroEntidade.update({
      where: { id },
      data: updateData,
      include: membroInclude,
    });

    return this.mapToMembroWithRelations(membro);
  }

  async delete(id: string): Promise<void> {
    await prisma.membroEntidade.delete({
      where: { id },
    });
  }

  async deleteByUsuarioId(usuarioId: string): Promise<number> {
    const result = await prisma.membroEntidade.deleteMany({
      where: { usuarioId },
    });
    return result.count;
  }

  findRawByUsuarioId(usuarioId: string): Promise<MembroRaw[]> {
    return prisma.membroEntidade.findMany({
      where: { usuarioId },
    });
  }

  async usuarioExists(usuarioId: string): Promise<boolean> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true },
    });
    return !!usuario;
  }

  async cargoExistsInEntidade(cargoId: string, entidadeId: string): Promise<boolean> {
    const cargo = await prisma.cargo.findFirst({
      where: { id: cargoId, entidadeId },
      select: { id: true },
    });
    return !!cargo;
  }

  private mapToMembroWithRelations(membro: {
    id: string;
    usuarioId: string;
    entidadeId: string;
    papel: "ADMIN" | "MEMBRO";
    cargoId: string | null;
    startedAt: Date;
    endedAt: Date | null;
    usuario: {
      id: string;
      nome: string;
      slug: string | null;
      urlFotoPerfil: string | null;
      eFacade: boolean;
      curso: { nome: string } | null;
    };
    cargo: {
      id: string;
      nome: string;
      descricao: string | null;
      ordem: number;
    } | null;
  }): MembroWithRelations {
    return {
      id: membro.id,
      usuarioId: membro.usuarioId,
      entidadeId: membro.entidadeId,
      papel: membro.papel,
      cargoId: membro.cargoId,
      startedAt: membro.startedAt,
      endedAt: membro.endedAt,
      usuario: {
        id: membro.usuario.id,
        nome: membro.usuario.nome,
        slug: membro.usuario.slug,
        urlFotoPerfil: membro.usuario.urlFotoPerfil,
        eFacade: membro.usuario.eFacade,
        curso: membro.usuario.curso,
      },
      cargo: membro.cargo
        ? {
            id: membro.cargo.id,
            nome: membro.cargo.nome,
            descricao: membro.cargo.descricao,
            ordem: membro.cargo.ordem,
          }
        : null,
    };
  }
}
