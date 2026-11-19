import { Prisma } from "@prisma/client";
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

  async findByIdWithEntidade(id: string): Promise<MembroWithEntidade | null> {
    const membro = await prisma.membroEntidade.findUnique({
      where: { id },
      include: membroWithEntidadeInclude,
    });

    if (!membro) {
      return null;
    }

    return {
      id: membro.id,
      papel: membro.papel,
      startedAt: membro.startedAt,
      endedAt: membro.endedAt,
      entidade: {
        id: membro.entidade.id,
        nome: membro.entidade.nome,
        slug: membro.entidade.slug,
        tipo: membro.entidade.tipo,
        urlFoto: membro.entidade.urlFoto,
        centro: {
          id: membro.entidade.centro.id,
          nome: membro.entidade.centro.nome,
          sigla: membro.entidade.centro.sigla,
        },
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
    const membro = await prisma.membroEntidade.update({
      where: { id },
      data,
      include: membroInclude,
    });

    return this.mapToMembroWithRelations(membro);
  }

  updateAsEntityAdmin(
    id: string,
    entidadeId: string,
    actorId: string,
    data: UpdateMembroInput
  ): Promise<MembroWithRelations | null> {
    return prisma.$transaction(async tx => {
      const master = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "Usuario"
        WHERE id = ${actorId} AND "papelPlataforma" = 'MASTER_ADMIN' FOR SHARE`;
      if (!master.length) {
        // Hold the actor's current authorization until the historical or current target is updated.
        const active = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "MembroEntidade"
          WHERE "usuarioId" = ${actorId} AND "entidadeId" = ${entidadeId}
            AND papel = 'ADMIN' AND "endedAt" IS NULL FOR UPDATE`;
        if (!active.length) {
          return null;
        }
      }
      const membro = await tx.membroEntidade.update({
        where: { id, entidadeId },
        data,
        include: membroInclude,
      });
      return this.mapToMembroWithRelations(membro);
    });
  }

  async updateOwn(
    id: string,
    usuarioId: string,
    data: UpdateMembroInput
  ): Promise<MembroWithRelations | null> {
    // PostgreSQL rechecks the predicate after waiting on a concurrent write
    // to this membership, including a demotion or an ended term.
    const master = { usuario: { papelPlataforma: "MASTER_ADMIN" as const } };
    const where: Prisma.MembroEntidadeWhereUniqueInput = { id, usuarioId };
    if (data.papel !== undefined) {
      Object.assign(where, master);
    } else if (data.endedAt === null) {
      where.OR = [master, { papel: "MEMBRO" }, { endedAt: null }];
    }

    try {
      const membro = await prisma.membroEntidade.update({ where, data, include: membroInclude });
      return this.mapToMembroWithRelations(membro);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return null;
      }
      throw error;
    }
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
