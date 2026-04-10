import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import type { CommonSchemas } from "../common-schemas";

/**
 * Shape mínimo compartilhado pelos itens de resultado da busca. Cada categoria
 * tem campos ligeiramente diferentes (entidades têm sigla, disciplinas têm
 * código, etc), mas todos incluem pelo menos `id`, `title` e `url`.
 */
const searchResultItemSchema = z
  .object({
    id: z.string().openapi({
      description: "Identificador do item (UUID para itens do banco, slug para páginas estáticas).",
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
    title: z.string().openapi({
      description: "Texto principal exibido para o item.",
      example: "Centro de Informática",
    }),
    subtitle: z.string().nullable().optional().openapi({
      description: "Texto secundário (sigla, categoria, etc).",
      example: "CI",
    }),
    url: z.string().openapi({
      description: "URL interna para navegar até o item completo.",
      example: "/entidade/centro-de-informatica",
    }),
    rank: z.number().optional().openapi({
      description:
        "Score de relevância do full-text search do PostgreSQL (quanto maior, mais relevante).",
      example: 0.87,
    }),
  })
  .openapi("SearchResultItem");

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
        paginas: z.array(searchResultItemSchema),
        guias: z.array(searchResultItemSchema),
        entidades: z.array(searchResultItemSchema),
        vagas: z.array(searchResultItemSchema),
        disciplinas: z.array(searchResultItemSchema),
        cursos: z.array(searchResultItemSchema),
        usuarios: z.array(searchResultItemSchema),
      })
      .openapi({
        description:
          "Resultados agrupados por categoria. Categorias sem resultados retornam array vazio.",
      }),
  })
  .openapi("SearchResponse");

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
                    id: "curriculos",
                    title: "Currículos",
                    subtitle: "Grades curriculares dos cursos",
                    url: "/curriculos",
                  },
                ],
                guias: [
                  {
                    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                    title: "Guia do Calouro de Ciência da Computação",
                    subtitle: "Guia",
                    url: "/guias/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                    rank: 0.92,
                  },
                ],
                entidades: [
                  {
                    id: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
                    title: "Centro de Informática",
                    subtitle: "CI",
                    url: "/entidade/centro-de-informatica",
                    rank: 0.87,
                  },
                ],
                vagas: [],
                disciplinas: [
                  {
                    id: "c3d4e5f6-a7b8-9012-cdef-345678901234",
                    title: "Introdução à Computação",
                    subtitle: "DCE1001",
                    url: "/disciplinas/dce1001",
                    rank: 0.81,
                  },
                ],
                cursos: [
                  {
                    id: "d4e5f6a7-b8c9-0123-defa-456789012345",
                    title: "Ciência da Computação",
                    subtitle: "Bacharelado",
                    url: "/curso/ciencia-da-computacao",
                    rank: 0.95,
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
