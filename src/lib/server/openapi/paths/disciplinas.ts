import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import type { CommonSchemas } from "../common-schemas";

/**
 * Resumo de disciplina retornado pelo endpoint de busca.
 */
const disciplinaSearchItemSchema = z
  .object({
    id: z.string().uuid(),
    codigo: z.string().openapi({
      description: "Código oficial da disciplina (formato SIGGA/PAAS).",
      example: "DCE1001",
    }),
    nome: z.string().openapi({ example: "Introdução à Computação" }),
    cargaHoraria: z.number().int().optional().openapi({
      description: "Carga horária em horas.",
      example: 60,
    }),
    creditos: z.number().int().optional().openapi({ example: 4 }),
    departamento: z.string().nullable().optional(),
  })
  .openapi("DisciplinaSearchItem");

/** Registra os paths de disciplinas no registry OpenAPI. */
export function registerDisciplinasPaths(registry: OpenAPIRegistry, _schemas: CommonSchemas): void {
  registry.registerPath({
    method: "get",
    path: "/disciplinas/search",
    tags: ["Disciplinas"],
    summary: "Buscar disciplinas por código ou nome",
    description:
      "Busca disciplinas pelo código oficial (ex: `DCE1001`) ou por parte do nome. Buscas com menos de 2 caracteres retornam array vazio sem consultar o banco.",
    request: {
      query: z.object({
        q: z.string().optional().openapi({
          description:
            "Termo de busca — código ou nome da disciplina. Se ausente ou com menos de 2 caracteres, retorna lista vazia.",
          example: "DCE1001",
        }),
      }),
    },
    responses: {
      200: {
        description: "Disciplinas correspondentes à busca.",
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
    },
  });
}
