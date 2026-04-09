import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import type { CommonSchemas } from "../common-schemas";

/**
 * Discipline (course subject) summary returned by the disciplines search endpoint.
 */
const disciplinaSearchItemSchema = z
  .object({
    id: z.string().uuid(),
    codigo: z.string().openapi({
      description: "Official discipline code (SIGGA/PAAS format).",
      example: "DCE1001",
    }),
    nome: z.string().openapi({ example: "Introdução à Computação" }),
    cargaHoraria: z.number().int().optional().openapi({
      description: "Workload in hours.",
      example: 60,
    }),
    creditos: z.number().int().optional().openapi({ example: 4 }),
    departamento: z.string().nullable().optional(),
  })
  .openapi("DisciplinaSearchItem");

export function registerDisciplinasPaths(registry: OpenAPIRegistry, schemas: CommonSchemas): void {
  const { errorResponses } = schemas;
  registry.registerPath({
    method: "get",
    path: "/disciplinas/search",
    tags: ["Disciplines"],
    summary: "Search disciplines by code or name",
    description:
      "Public endpoint to search for disciplines by their official code (e.g., `DCE1001`) or by name substring. Queries shorter than 2 characters return an empty result set without hitting the database. Used by the curriculum picker during onboarding and semester discipline management.",
    request: {
      query: z.object({
        q: z.string().min(2).openapi({
          description:
            "Search query — discipline code or name. Minimum 2 characters; shorter queries return an empty array without hitting the database.",
          example: "DCE1001",
        }),
      }),
    },
    responses: {
      200: {
        description: "Disciplines matching the query. Empty array if none match.",
        content: {
          "application/json": {
            schema: z.object({
              disciplinas: z.array(disciplinaSearchItemSchema),
            }),
            example: {
              disciplinas: [
                {
                  id: "550e8400-e29b-41d4-a716-446655440000",
                  codigo: "DCE1001",
                  nome: "Introdução à Computação",
                  cargaHoraria: 60,
                  creditos: 4,
                  departamento: "DCE",
                },
              ],
            },
          },
        },
      },
      ...errorResponses([500]),
    },
  });
}
