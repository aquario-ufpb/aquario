import { prisma } from "@/lib/server/db/prisma";
import { Prisma, type Projeto, type ProjetoAutor, type StatusProjeto } from "@prisma/client";
import type {
  IProjetosRepository,
  ProjetoWithRelations,
  FindManyProjetosParams,
  FindManyProjetosResult,
  CreateProjetoInput,
  CreateProjetoAutorInput,
} from "@/lib/server/db/interfaces/projetos-repository.interface";

const autorUsuarioSelect = {
  id: true,
  nome: true,
  urlFotoPerfil: true,
  slug: true,
} as const;

const autorEntidadeSelect = {
  id: true,
  nome: true,
  slug: true,
  tipo: true,
  urlFoto: true,
} as const;

const autoresInclude = {
  include: {
    usuario: { select: autorUsuarioSelect },
    entidade: { select: autorEntidadeSelect },
  },
  orderBy: {
    autorPrincipal: "desc" as const,
  },
} as const;

export class PrismaProjetosRepository implements IProjetosRepository {
  async findMany(params: FindManyProjetosParams): Promise<FindManyProjetosResult> {
    const {
      page,
      limit,
      status,
      entidadeId,
      usuarioId,
      tags,
      search,
      tipoEntidade,
      visibleToUserId,
      visibleToEntidadeIds,
      requireEntidadeAsPrincipal,
      orderBy,
      order,
    } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjetoWhereInput = {};

    if (status) {
      where.status = status as Prisma.EnumStatusProjetoFilter;
    }

    if (tags) {
      const tagArray = tags.split(",").map(t => t.trim());
      where.tags = { hasSome: tagArray };
    }

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: "insensitive" } },
        { subtitulo: { contains: search, mode: "insensitive" } },
      ];
    }

    // Compose autor-related filters into a single `autores: { some: ... }` so
    // they don't clobber each other.
    const autorFilter: Prisma.ProjetoAutorWhereInput = {};
    if (entidadeId) {
      autorFilter.entidadeId = entidadeId;
    }
    if (usuarioId) {
      autorFilter.usuarioId = usuarioId;
    }
    if (tipoEntidade && tipoEntidade !== "PESSOAL") {
      autorFilter.entidade = { tipo: tipoEntidade as Prisma.EnumTipoEntidadeFilter["equals"] };
    }
    if (Object.keys(autorFilter).length > 0) {
      where.autores = { some: autorFilter };
    } else if (tipoEntidade === "PESSOAL") {
      // Projects whose *principal* autor is a person (no entidade on the
      // principal row). Co-authors can still be entidades.
      where.autores = { some: { autorPrincipal: true, entidadeId: null } };
    }

    // Visibility scoping: when set, restrict to projects where the caller is
    // an autor or admin of an entidade-author. Combined with whatever autor
    // filter we already set via AND.
    if (visibleToUserId !== undefined || visibleToEntidadeIds !== undefined) {
      const visibilityOR: Prisma.ProjetoAutorWhereInput[] = [];
      if (visibleToUserId) {
        visibilityOR.push({ usuarioId: visibleToUserId });
      }
      if (visibleToEntidadeIds && visibleToEntidadeIds.length > 0) {
        // requireEntidadeAsPrincipal: only count entidade-admin matches when the
        // entidade is the principal author. Used by "Meus Publicados".
        visibilityOR.push(
          requireEntidadeAsPrincipal
            ? { entidadeId: { in: visibleToEntidadeIds }, autorPrincipal: true }
            : { entidadeId: { in: visibleToEntidadeIds } }
        );
      }
      const visibilityFilter: Prisma.ProjetoWhereInput =
        visibilityOR.length > 0 ? { autores: { some: { OR: visibilityOR } } } : { id: { in: [] } }; // not authorized to see anything
      where.AND = [...((where.AND as Prisma.ProjetoWhereInput[]) ?? []), visibilityFilter];
    }

    const orderByClause: Prisma.ProjetoOrderByWithRelationInput =
      orderBy === "autoresCount"
        ? { autores: { _count: order as Prisma.SortOrder } }
        : { [orderBy]: order as Prisma.SortOrder };

    const [projetos, total] = await Promise.all([
      prisma.projeto.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderByClause,
        include: { autores: autoresInclude },
      }),
      prisma.projeto.count({ where }),
    ]);

    return {
      projetos: projetos as unknown as ProjetoWithRelations[],
      total,
    };
  }

  async findBySlug(slug: string): Promise<ProjetoWithRelations | null> {
    const projeto = await prisma.projeto.findUnique({
      where: { slug },
      include: { autores: autoresInclude },
    });

    return projeto as unknown as ProjetoWithRelations | null;
  }

  async findBySlugBasic(slug: string): Promise<Projeto | null> {
    return await prisma.projeto.findUnique({
      where: { slug },
    });
  }

  async findBySlugWithAutores(
    slug: string
  ): Promise<(Projeto & { autores: ProjetoAutor[] }) | null> {
    return await prisma.projeto.findUnique({
      where: { slug },
      include: { autores: true },
    });
  }

  async slugExists(slug: string): Promise<boolean> {
    const projeto = await prisma.projeto.findUnique({
      where: { slug },
      select: { id: true },
    });
    return !!projeto;
  }

  async usuariosExist(ids: string[]): Promise<boolean> {
    if (ids.length === 0) {
      return true;
    }
    const existing = await prisma.usuario.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    return existing.length === ids.length;
  }

  async entidadesExist(ids: string[]): Promise<boolean> {
    if (ids.length === 0) {
      return true;
    }
    const existing = await prisma.entidade.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    return existing.length === ids.length;
  }

  async create(
    data: CreateProjetoInput,
    autores: CreateProjetoAutorInput[]
  ): Promise<ProjetoWithRelations> {
    const projeto = await prisma.projeto.create({
      data: {
        ...(data as Prisma.ProjetoCreateInput),
        autores: {
          create: autores.map(autor => ({
            usuarioId: autor.usuarioId ?? null,
            entidadeId: autor.entidadeId ?? null,
            autorPrincipal: autor.autorPrincipal,
          })),
        },
      },
      include: { autores: autoresInclude },
    });

    return projeto as unknown as ProjetoWithRelations;
  }

  async update(slug: string, data: Partial<CreateProjetoInput>): Promise<ProjetoWithRelations> {
    const projeto = await prisma.projeto.update({
      where: { slug },
      data: data as Prisma.ProjetoUpdateInput,
      include: { autores: autoresInclude },
    });

    return projeto as unknown as ProjetoWithRelations;
  }

  async delete(slug: string): Promise<void> {
    await prisma.projeto.delete({
      where: { slug },
    });
  }

  async updateStatus(
    slug: string,
    status: StatusProjeto,
    publicadoEm: Date | null
  ): Promise<ProjetoWithRelations> {
    const projeto = await prisma.projeto.update({
      where: { slug },
      data: { status, publicadoEm },
      include: { autores: autoresInclude },
    });

    return projeto as unknown as ProjetoWithRelations;
  }

  async replaceAutores(
    projetoId: string,
    slug: string,
    autores: CreateProjetoAutorInput[]
  ): Promise<ProjetoWithRelations | null> {
    await prisma.$transaction([
      prisma.projetoAutor.deleteMany({
        where: { projetoId },
      }),
      prisma.projetoAutor.createMany({
        data: autores.map(autor => ({
          projetoId,
          usuarioId: autor.usuarioId ?? null,
          entidadeId: autor.entidadeId ?? null,
          autorPrincipal: autor.autorPrincipal,
        })),
      }),
    ]);

    return this.findBySlug(slug);
  }
}
