import { prisma } from "@/lib/server/db/prisma";
import { Prisma } from "@prisma/client";
import type {
  IProjetosRepository,
  ProjetoWithRelations,
  FindManyProjetosParams,
  FindManyProjetosResult,
  CreateProjetoInput,
  CreateProjetoAutorInput,
} from "@/lib/server/db/interfaces/projetos-repository.interface";
import type { Projeto, ProjetoAutor, StatusProjeto } from "@prisma/client";

/**
 * Select padrão para dados públicos do usuario (sem PII)
 */
const autorUsuarioSelect = {
  id: true,
  nome: true,
  urlFotoPerfil: true,
  slug: true,
} as const;

/**
 * Include padrão para autores com usuario
 */
const autoresInclude = {
  include: {
    usuario: {
      select: autorUsuarioSelect,
    },
  },
  orderBy: {
    autorPrincipal: "desc" as const,
  },
} as const;

/**
 * Select padrão para entidade em listagem
 */
const entidadeListSelect = {
  id: true,
  nome: true,
  slug: true,
  tipo: true,
  urlFoto: true,
} as const;

/**
 * Select padrão para entidade em detalhe
 */
const entidadeDetailSelect = {
  ...entidadeListSelect,
  website: true,
  descricao: true,
} as const;

export class PrismaProjetosRepository implements IProjetosRepository {
  async findMany(params: FindManyProjetosParams): Promise<FindManyProjetosResult> {
    const { page, limit, status, entidadeId, usuarioId, tags, search, orderBy, order } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjetoWhereInput = {};

    if (status) {
      where.status = status as Prisma.EnumStatusProjetoFilter;
    }

    if (entidadeId) {
      where.entidadeId = entidadeId;
    }

    if (tags) {
      const tagArray = tags.split(",").map(t => t.trim());
      where.tags = { hasSome: tagArray };
    }

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: "insensitive" } },
        { subtitulo: { contains: search, mode: "insensitive" } },
        { descricao: { contains: search, mode: "insensitive" } },
      ];
    }

    if (usuarioId) {
      where.autores = {
        some: { usuarioId },
      };
    }

    const orderByClause: Prisma.ProjetoOrderByWithRelationInput = {
      [orderBy]: order as Prisma.SortOrder,
    };

    const [projetos, total] = await Promise.all([
      prisma.projeto.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderByClause,
        include: {
          autores: autoresInclude,
          entidade: {
            select: entidadeListSelect,
          },
        },
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
      include: {
        autores: autoresInclude,
        entidade: {
          select: entidadeDetailSelect,
        },
      },
    });

    return projeto as unknown as ProjetoWithRelations | null;
  }

  async findBySlugBasic(slug: string): Promise<Projeto | null> {
    return prisma.projeto.findUnique({
      where: { slug },
    });
  }

  async findBySlugWithAutores(
    slug: string
  ): Promise<(Projeto & { autores: ProjetoAutor[] }) | null> {
    return prisma.projeto.findUnique({
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
    const existingUsuarios = await prisma.usuario.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    return existingUsuarios.length === ids.length;
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
            usuarioId: autor.usuarioId,
            autorPrincipal: autor.autorPrincipal,
          })),
        },
      },
      include: {
        autores: autoresInclude,
        entidade: true,
      },
    });

    return projeto as unknown as ProjetoWithRelations;
  }

  async update(
    slug: string,
    data: Partial<CreateProjetoInput>
  ): Promise<ProjetoWithRelations> {
    const projeto = await prisma.projeto.update({
      where: { slug },
      data: data as Prisma.ProjetoUpdateInput,
      include: {
        autores: autoresInclude,
        entidade: true,
      },
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
      include: {
        autores: autoresInclude,
        entidade: true,
      },
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
          usuarioId: autor.usuarioId,
          autorPrincipal: autor.autorPrincipal,
        })),
      }),
    ]);

    return this.findBySlug(slug);
  }
}
