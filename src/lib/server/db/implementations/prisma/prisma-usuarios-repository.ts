import { prisma } from "@/lib/server/db/prisma";
import type { IUsuariosRepository } from "@/lib/server/db/interfaces/usuarios-repository.interface";
import type {
  UsuarioWithRelations,
  UsuarioCreateInput,
  PapelPlataforma,
} from "@/lib/server/db/interfaces/types";
import { Prisma } from "@prisma/client";
import type { OnboardingMetadata } from "@/lib/shared/types";

export class PrismaUsuariosRepository implements IUsuariosRepository {
  /**
   * Generate a slug from email (part before @)
   */
  private emailToSlug(email: string | null): string | null {
    if (!email) {
      return null;
    }
    const emailPart = email.split("@")[0];
    if (!emailPart || emailPart.trim().length === 0) {
      return null;
    }

    const slug = emailPart
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .trim();

    // If slug becomes empty after normalization, return null
    return slug || null;
  }

  /**
   * Ensure slug is unique by appending a number if needed
   */
  private async ensureUniqueSlug(
    baseSlug: string | null,
    excludeUserId?: string
  ): Promise<string | null> {
    if (!baseSlug) {
      return null;
    }

    // Normalize slug to lowercase for case-insensitive uniqueness
    const normalizedBaseSlug = baseSlug.toLowerCase().trim();
    let slug = normalizedBaseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.usuario.findFirst({
        where: {
          slug,
          ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
        },
      });

      if (!existing) {
        return slug;
      }

      slug = `${normalizedBaseSlug}-${counter}`;
      counter++;
    }
  }

  async create(data: UsuarioCreateInput): Promise<UsuarioWithRelations> {
    // Generate slug from email (null for facade users)
    const baseSlug = data.eFacade ? null : this.emailToSlug(data.email ?? null);
    const slug = baseSlug ? await this.ensureUniqueSlug(baseSlug) : null;

    const usuario = await prisma.usuario.create({
      data: {
        nome: data.nome,
        email: data.email ? data.email.toLowerCase().trim() : null,
        senhaHash: data.senhaHash ?? null,
        centroId: data.centroId,
        cursoId: data.cursoId,
        permissoes: data.permissoes ?? [],
        papelPlataforma: data.papelPlataforma ?? "USER",
        eVerificado: data.eVerificado ?? false,
        eFacade: data.eFacade ?? false,
        urlFotoPerfil: data.urlFotoPerfil,
        matricula: data.matricula,
        slug,
      },
      include: {
        centro: true,
        curso: true,
      },
    });

    return usuario;
  }

  async findById(id: string): Promise<UsuarioWithRelations | null> {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        centro: true,
        curso: true,
      },
    });

    return usuario;
  }

  async findByEmail(email: string): Promise<UsuarioWithRelations | null> {
    const normalizedEmail = email.toLowerCase().trim();

    const usuario = await prisma.usuario.findUnique({
      where: { email: normalizedEmail },
      include: {
        centro: true,
        curso: true,
      },
    });

    return usuario;
  }

  async findBySlug(slug: string): Promise<UsuarioWithRelations | null> {
    // Normalize slug to lowercase for case-insensitive lookup
    const normalizedSlug = slug.toLowerCase();
    const usuario = await prisma.usuario.findUnique({
      where: { slug: normalizedSlug },
      include: {
        centro: true,
        curso: true,
      },
    });

    return usuario;
  }

  async findMany(): Promise<UsuarioWithRelations[]> {
    const usuarios = await prisma.usuario.findMany({
      include: {
        centro: true,
        curso: true,
      },
      orderBy: {
        nome: "asc",
      },
    });

    return usuarios;
  }

  async findManyPaginated(options: {
    page?: number;
    limit?: number;
    filter?: "all" | "facade" | "real";
    search?: string;
  }): Promise<{ users: UsuarioWithRelations[]; total: number }> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 25;
    const skip = (page - 1) * limit;
    const filter = options.filter ?? "all";
    const searchQuery = options.search?.trim();

    // Build base where clause based on filter
    const filterWhere =
      filter === "facade" ? { eFacade: true } : filter === "real" ? { eFacade: false } : undefined;

    // Build search where clause if search query is provided
    let searchWhere: Prisma.UsuarioWhereInput | undefined = undefined;
    if (searchQuery) {
      // Normalize query for accent-insensitive search
      const normalizedQuery = searchQuery
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      searchWhere = {
        OR: [
          {
            nome: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
          {
            centro: {
              OR: [
                {
                  nome: {
                    contains: normalizedQuery,
                    mode: "insensitive",
                  },
                },
                {
                  sigla: {
                    contains: normalizedQuery,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
          {
            curso: {
              nome: {
                contains: normalizedQuery,
                mode: "insensitive",
              },
            },
          },
        ],
      };
    }

    // Combine filter and search where clauses
    let where: Prisma.UsuarioWhereInput | undefined = undefined;
    if (filterWhere && searchWhere) {
      // Both filter and search: combine with AND
      where = {
        ...filterWhere,
        ...searchWhere,
      };
    } else if (filterWhere) {
      // Only filter
      where = filterWhere;
    } else if (searchWhere) {
      // Only search
      where = searchWhere;
    }

    const [users, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        include: {
          centro: true,
          curso: true,
        },
        orderBy: {
          nome: "asc",
        },
        skip,
        take: limit,
      }),
      prisma.usuario.count({ where }),
    ]);

    return { users, total };
  }

  async search(options: { query: string; limit?: number }): Promise<UsuarioWithRelations[]> {
    const limit = options.limit ?? 10;
    const searchQuery = options.query.trim();

    if (!searchQuery) {
      return [];
    }

    // Normalize query for accent-insensitive search
    const normalizedQuery = searchQuery
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const usuarios = await prisma.usuario.findMany({
      where: {
        OR: [
          {
            nome: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
          {
            centro: {
              OR: [
                {
                  nome: {
                    contains: normalizedQuery,
                    mode: "insensitive",
                  },
                },
                {
                  sigla: {
                    contains: normalizedQuery,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
          {
            curso: {
              nome: {
                contains: normalizedQuery,
                mode: "insensitive",
              },
            },
          },
        ],
      },
      include: {
        centro: true,
        curso: true,
      },
      orderBy: {
        nome: "asc",
      },
      take: limit,
    });

    return usuarios;
  }

  async markAsVerified(id: string): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: { eVerificado: true },
    });
  }

  async updatePassword(id: string, senhaHash: string): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: { senhaHash },
    });
  }

  async updatePapelPlataforma(id: string, papelPlataforma: PapelPlataforma): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: { papelPlataforma },
    });
  }

  async updateFotoPerfil(id: string, urlFotoPerfil: string | null): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: { urlFotoPerfil },
    });
  }

  async updateCentro(id: string, centroId: string): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: { centroId },
    });
  }

  async updateCurso(id: string, cursoId: string): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: { cursoId },
    });
  }

  async updateSlug(id: string, slug: string | null): Promise<void> {
    // Ensure slug is unique if provided (excluding current user)
    const finalSlug = slug ? await this.ensureUniqueSlug(slug, id) : null;

    await prisma.usuario.update({
      where: { id },
      data: { slug: finalSlug },
    });
  }

  async updatePeriodoAtual(id: string, periodoAtual: string | null): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: { periodoAtual },
    });
  }

  async getOnboardingMetadata(userId: string): Promise<OnboardingMetadata | null> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { onboardingMetadata: true },
    });
    return (usuario?.onboardingMetadata as OnboardingMetadata) ?? null;
  }

  async updateOnboardingMetadata(
    userId: string,
    metadata: Partial<OnboardingMetadata>
  ): Promise<void> {
    const existing = await this.getOnboardingMetadata(userId);
    const current = existing ?? {};

    const merged: OnboardingMetadata = {
      ...current,
      ...metadata,
      semesters: {
        ...current.semesters,
        ...Object.fromEntries(
          Object.entries(metadata.semesters ?? {}).map(([key, val]) => [
            key,
            { ...current.semesters?.[key], ...val },
          ])
        ),
      },
    };

    // Remove empty semesters object if it has no keys
    if (Object.keys(merged.semesters ?? {}).length === 0) {
      delete merged.semesters;
    }

    await prisma.usuario.update({
      where: { id: userId },
      data: { onboardingMetadata: merged as Prisma.JsonObject },
    });
  }

  async clearOnboardingMetadata(userId: string): Promise<void> {
    await prisma.usuario.update({
      where: { id: userId },
      data: { onboardingMetadata: Prisma.JsonNull },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.usuario.delete({
      where: { id },
    });
  }
}
