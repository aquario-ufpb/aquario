import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/db/prisma";
import type { ISearchRepository } from "@/lib/server/db/interfaces/search-repository.interface";
import type {
  SearchResultGuia,
  SearchResultEntidade,
  SearchResultVaga,
  SearchResultProjeto,
  SearchResultDisciplina,
  SearchResultCurso,
  SearchResultUsuario,
} from "@/lib/shared/types/search.types";

function mapEntidadeImagePath(urlFoto: string | null): string | null {
  if (!urlFoto) {
    return null;
  }

  if (urlFoto.startsWith("/") || urlFoto.startsWith("http")) {
    return urlFoto;
  }

  return `/api/content-images/assets/entidades/${urlFoto}`;
}

export class PrismaSearchRepository implements ISearchRepository {
  async searchGuias(query: string, limit: number): Promise<SearchResultGuia[]> {
    const results = await prisma.$queryRaw<
      Array<{ id: string; titulo: string; slug: string; descricao: string | null }>
    >(Prisma.sql`
      SELECT id, titulo, slug, descricao
      FROM "Guia"
      WHERE status = 'ATIVO'
        AND to_tsvector('portuguese', immutable_unaccent(titulo || ' ' || coalesce(descricao, '')))
            @@ plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ORDER BY ts_rank(
        to_tsvector('portuguese', immutable_unaccent(titulo || ' ' || coalesce(descricao, ''))),
        plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ) DESC
      LIMIT ${limit}
    `);

    return results.map(r => ({ kind: "guia" as const, ...r }));
  }

  async searchEntidades(query: string, limit: number): Promise<SearchResultEntidade[]> {
    const results = await prisma.$queryRaw<
      Array<{ id: string; nome: string; slug: string | null; tipo: string; urlFoto: string | null }>
    >(Prisma.sql`
      SELECT id, nome, slug, tipo::text, "urlFoto"
      FROM "Entidade"
      WHERE to_tsvector('portuguese', immutable_unaccent(nome || ' ' || coalesce(descricao, '')))
            @@ plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ORDER BY ts_rank(
        to_tsvector('portuguese', immutable_unaccent(nome || ' ' || coalesce(descricao, ''))),
        plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ) DESC
      LIMIT ${limit}
    `);

    return results.map(({ urlFoto, ...r }) => ({
      kind: "entidade" as const,
      ...r,
      imagePath: mapEntidadeImagePath(urlFoto),
    }));
  }

  async searchVagas(query: string, limit: number): Promise<SearchResultVaga[]> {
    const results = await prisma.$queryRaw<
      Array<{ id: string; titulo: string; tipoVaga: string }>
    >(Prisma.sql`
      SELECT id, titulo, "tipoVaga"::text AS "tipoVaga"
      FROM "Vaga"
      WHERE "deletadoEm" IS NULL
        AND to_tsvector('portuguese', immutable_unaccent(titulo || ' ' || coalesce(descricao, '')))
            @@ plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ORDER BY ts_rank(
        to_tsvector('portuguese', immutable_unaccent(titulo || ' ' || coalesce(descricao, ''))),
        plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ) DESC
      LIMIT ${limit}
    `);

    return results.map(r => ({ kind: "vaga" as const, ...r }));
  }

  async searchProjetos(query: string, limit: number): Promise<SearchResultProjeto[]> {
    const results = await prisma.$queryRaw<
      Array<{ id: string; titulo: string; slug: string; subtitulo: string | null }>
    >(Prisma.sql`
      SELECT id, titulo, slug, subtitulo
      FROM "Projeto"
      WHERE status = 'PUBLICADO'
        AND to_tsvector(
              'portuguese',
              immutable_unaccent(
                titulo || ' ' || coalesce(subtitulo, '') || ' ' || array_to_string(tags, ' ')
              )
            )
            @@ plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ORDER BY ts_rank(
        to_tsvector(
          'portuguese',
          immutable_unaccent(
            titulo || ' ' || coalesce(subtitulo, '') || ' ' || array_to_string(tags, ' ')
          )
        ),
        plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ) DESC
      LIMIT ${limit}
    `);

    return results.map(r => ({ kind: "projeto" as const, ...r }));
  }

  async searchDisciplinas(query: string, limit: number): Promise<SearchResultDisciplina[]> {
    const results = await prisma.$queryRaw<
      Array<{ id: string; codigo: string; nome: string }>
    >(Prisma.sql`
      SELECT id, codigo, nome
      FROM "Disciplina"
      WHERE to_tsvector('portuguese', immutable_unaccent(nome || ' ' || coalesce(codigo, '')))
            @@ plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ORDER BY ts_rank(
        to_tsvector('portuguese', immutable_unaccent(nome || ' ' || coalesce(codigo, ''))),
        plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ) DESC
      LIMIT ${limit}
    `);

    return results.map(r => ({ kind: "disciplina" as const, ...r }));
  }

  async searchCursos(query: string, limit: number): Promise<SearchResultCurso[]> {
    const results = await prisma.$queryRaw<Array<{ id: string; nome: string }>>(Prisma.sql`
      SELECT id, nome
      FROM "Curso"
      WHERE to_tsvector('portuguese', immutable_unaccent(nome))
            @@ plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ORDER BY ts_rank(
        to_tsvector('portuguese', immutable_unaccent(nome)),
        plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ) DESC
      LIMIT ${limit}
    `);

    return results.map(r => ({ kind: "curso" as const, ...r }));
  }

  async searchUsuarios(query: string, limit: number): Promise<SearchResultUsuario[]> {
    const results = await prisma.$queryRaw<
      Array<{ id: string; nome: string; slug: string | null; urlFotoPerfil: string | null }>
    >(Prisma.sql`
      SELECT id, nome, slug, "urlFotoPerfil"
      FROM "Usuario"
      WHERE "eFacade" = false
        AND to_tsvector('portuguese', immutable_unaccent(nome))
            @@ plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ORDER BY ts_rank(
        to_tsvector('portuguese', immutable_unaccent(nome)),
        plainto_tsquery('portuguese', immutable_unaccent(${query}))
      ) DESC
      LIMIT ${limit}
    `);

    return results.map(r => ({ kind: "usuario" as const, ...r }));
  }
}
