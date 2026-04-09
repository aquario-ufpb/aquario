import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { errorResponses } from "../common-schemas";

/**
 * Shared minimal shape for search result items. Each result category has
 * slightly different fields (entities have sigla, disciplines have codigo, etc),
 * but all include at least `id`, `title` and `url` for the Scalar UI to render
 * meaningful examples.
 */
const searchResultItemSchema = z
  .object({
    id: z.string().openapi({
      description: "Entity identifier (UUID for DB-backed items, slug for static pages).",
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
    title: z.string().openapi({
      description: "Primary display text for the result item.",
      example: "Centro de Informática",
    }),
    subtitle: z.string().nullable().optional().openapi({
      description: "Secondary display text (sigla, category, etc).",
      example: "CI",
    }),
    url: z.string().openapi({
      description: "In-app URL to navigate to the full item.",
      example: "/entidade/centro-de-informatica",
    }),
    rank: z.number().optional().openapi({
      description: "PostgreSQL full-text search rank score (higher is more relevant).",
      example: 0.87,
    }),
  })
  .openapi("SearchResultItem");

/**
 * Unified search response. Results are grouped by entity category so the
 * command palette UI can render them in separate sections.
 */
const searchResponseSchema = z
  .object({
    query: z.string().openapi({
      description: "The normalized search query that was executed.",
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
          "Results grouped by category. Empty arrays are returned for categories with no matches.",
      }),
  })
  .openapi("SearchResponse");

export function registerSearchPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "get",
    path: "/search",
    tags: ["Search"],
    summary: "Unified full-text search across all entity categories",
    description:
      "Execute a unified full-text search across all major entity categories (static pages, guides, entities, jobs, disciplines, courses, users). Uses PostgreSQL full-text search with the `unaccent` extension, so queries match Brazilian Portuguese accents transparently. Results are ranked by relevance using `ts_rank`. Queries shorter than 3 characters return an empty result set without hitting the database.",
    request: {
      query: z.object({
        q: z.string().min(3).openapi({
          description: "Search query. Minimum 3 characters; shorter queries return empty results.",
          example: "computação",
        }),
        limit: z.coerce.number().int().min(1).max(20).default(5).openapi({
          description: "Maximum results per category (1-20, default 5).",
          example: 5,
        }),
      }),
    },
    responses: {
      200: {
        description:
          "Search results grouped by category. Categories with no matches return empty arrays instead of being omitted.",
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
      ...errorResponses([500]),
    },
  });
}
