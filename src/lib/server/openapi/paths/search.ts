import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import type { CommonSchemas } from "../common-schemas";

const searchResultPaginaSchema = z
  .object({
    kind: z.literal("pagina"),
    id: z.string().openapi({
      description: "Identificador da página estática.",
      example: "mapas",
    }),
    titulo: z.string().openapi({
      description: "Título da página.",
      example: "Mapas do Campus",
    }),
    descricao: z.string().openapi({
      description: "Descrição curta da página.",
      example: "Visualize mapas, prédios e laboratórios da UFPB",
    }),
    url: z.string().openapi({
      description: "URL interna da página.",
      example: "/mapas",
    }),
  })
  .openapi("SearchResultPagina");

const searchResultGuiaSchema = z
  .object({
    kind: z.literal("guia"),
    id: z.string().openapi({
      description: "Identificador do guia.",
      example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    }),
    titulo: z.string().openapi({
      description: "Título do guia.",
      example: "Guia do Calouro de Ciência da Computação",
    }),
    slug: z.string().openapi({
      description: "Slug usado na rota do guia.",
      example: "guia-do-calouro",
    }),
    descricao: z.string().nullable().openapi({
      description: "Descrição curta do guia.",
      example: "Orientações para novos estudantes",
    }),
  })
  .openapi("SearchResultGuia");

const searchResultEntidadeSchema = z
  .object({
    kind: z.literal("entidade"),
    id: z.string().openapi({
      description: "Identificador da entidade.",
      example: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    }),
    nome: z.string().openapi({
      description: "Nome da entidade.",
      example: "Centro de Informática",
    }),
    slug: z.string().nullable().openapi({
      description: "Slug usado na rota da entidade.",
      example: "centro-de-informatica",
    }),
    tipo: z.string().openapi({
      description: "Tipo da entidade.",
      example: "CENTRO_ACADEMICO",
    }),
    imagePath: z.string().nullable().openapi({
      description: "URL da imagem exibida para resultados que possuem logo/foto.",
      example: "/api/content-images/assets/entidades/ci.png",
    }),
  })
  .openapi("SearchResultEntidade");

const searchResultVagaSchema = z
  .object({
    kind: z.literal("vaga"),
    id: z.string().openapi({
      description: "Identificador da vaga.",
      example: "c3d4e5f6-a7b8-9012-cdef-345678901234",
    }),
    titulo: z.string().openapi({
      description: "Título da vaga.",
      example: "Estágio em Desenvolvimento Web",
    }),
    tipoVaga: z.string().openapi({
      description: "Tipo da vaga.",
      example: "ESTAGIO",
    }),
  })
  .openapi("SearchResultVaga");

const searchResultDisciplinaSchema = z
  .object({
    kind: z.literal("disciplina"),
    id: z.string().openapi({
      description: "Identificador da disciplina.",
      example: "d4e5f6a7-b8c9-0123-defa-456789012345",
    }),
    codigo: z.string().openapi({
      description: "Código da disciplina.",
      example: "DCE1001",
    }),
    nome: z.string().openapi({
      description: "Nome da disciplina.",
      example: "Introdução à Computação",
    }),
  })
  .openapi("SearchResultDisciplina");

const searchResultCursoSchema = z
  .object({
    kind: z.literal("curso"),
    id: z.string().openapi({
      description: "Identificador do curso.",
      example: "e5f6a7b8-c9d0-1234-efab-567890123456",
    }),
    nome: z.string().openapi({
      description: "Nome do curso.",
      example: "Ciência da Computação",
    }),
  })
  .openapi("SearchResultCurso");

const searchResultUsuarioSchema = z
  .object({
    kind: z.literal("usuario"),
    id: z.string().openapi({
      description: "Identificador do usuário.",
      example: "f6a7b8c9-d0e1-2345-fabc-678901234567",
    }),
    nome: z.string().openapi({
      description: "Nome do usuário.",
      example: "Maria Silva",
    }),
    slug: z.string().nullable().openapi({
      description: "Slug usado na rota do perfil público.",
      example: "maria-silva",
    }),
    urlFotoPerfil: z.string().nullable().openapi({
      description: "URL da foto de perfil, quando disponível.",
      example: "https://api.dicebear.com/9.x/initials/svg?seed=Maria%20Silva",
    }),
  })
  .openapi("SearchResultUsuario");

/**
 * Resposta unificada da busca. Resultados são agrupados por categoria para que
 * a UI do command palette possa renderizá-los em seções separadas.
 */
const searchResponseSchema = z
  .object({
    query: z.string().openapi({
      description: "Query de busca normalizada que foi executada.",
      example: "computação",
    }),
    results: z
      .object({
        paginas: z.array(searchResultPaginaSchema),
        guias: z.array(searchResultGuiaSchema),
        entidades: z.array(searchResultEntidadeSchema),
        vagas: z.array(searchResultVagaSchema),
        disciplinas: z.array(searchResultDisciplinaSchema),
        cursos: z.array(searchResultCursoSchema),
        usuarios: z.array(searchResultUsuarioSchema),
      })
      .openapi({
        description:
          "Resultados agrupados por categoria. Categorias sem resultados retornam array vazio.",
      }),
  })
  .openapi("SearchResponse");

/** Registra os paths de busca unificada no registry OpenAPI. */
export function registerSearchPaths(registry: OpenAPIRegistry, _schemas: CommonSchemas): void {
  registry.registerPath({
    method: "get",
    path: "/search",
    tags: ["Busca"],
    summary: "Busca unificada em todas as categorias",
    description:
      "Full-text search em páginas, guias, entidades, vagas, disciplinas, cursos e usuários. Acento-insensível (português). Queries com menos de 3 caracteres retornam resultados vazios.",
    request: {
      query: z.object({
        q: z.string().optional().openapi({
          description:
            "Termo de busca. Se ausente ou com menos de 3 caracteres, retorna resultados vazios.",
          example: "computação",
        }),
        limit: z.coerce.number().int().min(1).max(20).default(5).openapi({
          description: "Número máximo de resultados por categoria (1-20, padrão 5).",
          example: 5,
        }),
      }),
    },
    responses: {
      200: {
        description:
          "Resultados da busca agrupados por categoria (arrays vazios onde não há matches).",
        content: {
          "application/json": {
            schema: searchResponseSchema,
            example: {
              query: "computação",
              results: {
                paginas: [
                  {
                    kind: "pagina",
                    id: "curriculos",
                    titulo: "Currículos",
                    descricao: "Grades curriculares dos cursos",
                    url: "/curriculos",
                  },
                ],
                guias: [
                  {
                    kind: "guia",
                    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                    titulo: "Guia do Calouro de Ciência da Computação",
                    slug: "guia-do-calouro",
                    descricao: "Orientações para novos estudantes",
                  },
                ],
                entidades: [
                  {
                    kind: "entidade",
                    id: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
                    nome: "Centro de Informática",
                    slug: "centro-de-informatica",
                    tipo: "CENTRO_ACADEMICO",
                    imagePath: "/api/content-images/assets/entidades/ci.png",
                  },
                ],
                vagas: [],
                disciplinas: [
                  {
                    kind: "disciplina",
                    id: "c3d4e5f6-a7b8-9012-cdef-345678901234",
                    codigo: "DCE1001",
                    nome: "Introdução à Computação",
                  },
                ],
                cursos: [
                  {
                    kind: "curso",
                    id: "d4e5f6a7-b8c9-0123-defa-456789012345",
                    nome: "Ciência da Computação",
                  },
                ],
                usuarios: [],
              },
            },
          },
        },
      },
    },
  });
}
