import { prisma } from "@/lib/server/db/prisma";
import type { IEntidadesRepository } from "@/lib/server/db/interfaces/entidades-repository.interface";
import type { EntidadeWithRelations, EntidadeUpdateInput } from "@/lib/server/db/interfaces/types";

export class PrismaEntidadesRepository implements IEntidadesRepository {
  async findMany(): Promise<EntidadeWithRelations[]> {
    const entidades = await prisma.entidade.findMany({
      include: {
        centro: true,
        cargos: {
          orderBy: {
            ordem: "asc",
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    });

    return entidades;
  }

  async findById(id: string): Promise<EntidadeWithRelations | null> {
    const entidade = await prisma.entidade.findUnique({
      where: { id },
      include: {
        centro: true,
        cargos: {
          orderBy: {
            ordem: "asc",
          },
        },
        membros: {
          include: {
            usuario: {
              include: {
                curso: true,
              },
            },
            cargo: true,
          },
        },
      },
    });

    return entidade;
  }

  async findBySlug(slug: string): Promise<EntidadeWithRelations | null> {
    // Query the dedicated slug column
    const entidade = await prisma.entidade.findUnique({
      where: { slug },
      include: {
        centro: true,
        cargos: {
          orderBy: {
            ordem: "asc",
          },
        },
        membros: {
          include: {
            usuario: {
              include: {
                curso: true,
              },
            },
            cargo: true,
          },
        },
      },
    });

    return entidade;
  }

  async update(id: string, data: EntidadeUpdateInput): Promise<void> {
    const updateData: Record<string, unknown> = {};

    if (data.nome !== undefined) {
      updateData.nome = data.nome;
    }
    if (data.slug !== undefined) {
      updateData.slug = data.slug;
    }
    if (data.subtitle !== undefined) {
      updateData.subtitle = data.subtitle;
    }
    if (data.descricao !== undefined) {
      updateData.descricao = data.descricao;
    }
    if (data.tipo !== undefined) {
      updateData.tipo = data.tipo;
    }
    if (data.urlFoto !== undefined) {
      updateData.urlFoto = data.urlFoto;
    }
    if (data.contato !== undefined) {
      updateData.contato = data.contato;
    }
    if (data.instagram !== undefined) {
      updateData.instagram = data.instagram;
    }
    if (data.linkedin !== undefined) {
      updateData.linkedin = data.linkedin;
    }
    if (data.website !== undefined) {
      updateData.website = data.website;
    }
    if (data.location !== undefined) {
      updateData.location = data.location;
    }
    if (data.foundingDate !== undefined) {
      updateData.foundingDate = data.foundingDate;
    }
    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata;
    }

    await prisma.entidade.update({
      where: { id },
      data: updateData,
    });
  }

  private nomeToSlug(nome: string): string {
    return nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }
}
