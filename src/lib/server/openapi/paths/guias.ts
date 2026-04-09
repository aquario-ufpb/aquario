import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { errorResponses } from "../common-schemas";

/**
 * Guia (academic guide) shape. Guides organize tutorial content for students
 * — typically course-specific (e.g., "Guia do Calouro de Ciência da Computação").
 * Handlers return Prisma-shaped objects without an explicit mapper, so this
 * schema mirrors the shape returned from the repository.
 */
const guiaResponseSchema = z
  .object({
    id: z.string().uuid(),
    titulo: z.string().openapi({ example: "Guia do Calouro de Ciência da Computação" }),
    descricao: z.string().nullable().optional(),
    cursoId: z.string().uuid().nullable().optional(),
    status: z
      .enum(["PUBLICADO", "RASCUNHO", "ARQUIVADO"])
      .optional()
      .openapi({ example: "PUBLICADO" }),
    criadoEm: z.string().datetime().optional(),
    atualizadoEm: z.string().datetime().optional(),
  })
  .openapi("GuiaResponse");

const secaoGuiaResponseSchema = z
  .object({
    id: z.string().uuid(),
    titulo: z.string().openapi({ example: "Primeiros passos no campus" }),
    descricao: z.string().nullable().optional(),
    ordem: z.number().int().openapi({ example: 1 }),
    guiaId: z.string().uuid(),
  })
  .openapi("SecaoGuiaResponse");

const subSecaoGuiaResponseSchema = z
  .object({
    id: z.string().uuid(),
    titulo: z.string().openapi({ example: "Onde fica o Centro de Informática" }),
    conteudo: z.string().openapi({
      description: "Markdown content of the subsection.",
      example: "O CI fica localizado no Campus I, próximo ao bloco de engenharias...",
    }),
    ordem: z.number().int().openapi({ example: 1 }),
    secaoId: z.string().uuid(),
  })
  .openapi("SubSecaoGuiaResponse");

export function registerGuiasPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "get",
    path: "/guias",
    tags: ["Guides"],
    summary: "List all guides (optionally filtered by course)",
    description:
      "Public endpoint returning all academic guides. Optionally filter by `cursoId` to get only guides associated with a specific course.",
    request: {
      query: z.object({
        cursoId: z.string().uuid().optional().openapi({
          description: "Filter guides by course id.",
          example: "550e8400-e29b-41d4-a716-446655440000",
        }),
      }),
    },
    responses: {
      200: {
        description: "List of guides.",
        content: { "application/json": { schema: z.array(guiaResponseSchema) } },
      },
      ...errorResponses([500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/guias/{id}/secoes",
    tags: ["Guides"],
    summary: "List sections for a guide",
    description:
      "Public endpoint returning all top-level sections of a guide, ordered by the `ordem` field. Sections group related subsections within a guide.",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "List of sections ordered by the 'ordem' field.",
        content: { "application/json": { schema: z.array(secaoGuiaResponseSchema) } },
      },
      ...errorResponses([500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/guias/secoes/{id}/subsecoes",
    tags: ["Guides"],
    summary: "List subsections for a section",
    description:
      "Public endpoint returning all subsections within a section, ordered by `ordem`. Subsection content is Markdown.",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "List of subsections ordered by the 'ordem' field.",
        content: { "application/json": { schema: z.array(subSecaoGuiaResponseSchema) } },
      },
      ...errorResponses([500]),
    },
  });
}
