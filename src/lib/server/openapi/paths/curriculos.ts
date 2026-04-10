import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import type { CommonSchemas } from "../common-schemas";

/**
 * Disciplina dentro da grade curricular (campos de resumo).
 */
const gradeDisciplinaSchema = z
  .object({
    id: z.string().uuid(),
    codigo: z.string().openapi({ example: "DCE1001" }),
    nome: z.string().openapi({ example: "Introdução à Computação" }),
    cargaHoraria: z.number().int().optional(),
    creditos: z.number().int().optional(),
    natureza: z.enum(["OBRIGATORIA", "OPTATIVA", "ELETIVA", "COMPLEMENTAR"]).optional().openapi({
      description: "Natureza da disciplina no currículo (obrigatória, optativa, etc).",
      example: "OBRIGATORIA",
    }),
  })
  .openapi("GradeDisciplina");

/**
 * Um período/semestre da grade, contendo as disciplinas que devem ser cursadas.
 */
const gradePeriodoSchema = z
  .object({
    periodo: z.number().int().openapi({ example: 1 }),
    disciplinas: z.array(gradeDisciplinaSchema),
  })
  .openapi("GradePeriodo");

/**
 * Resposta completa da grade curricular ativa de um curso.
 */
const curriculoGradeResponseSchema = z
  .object({
    id: z.string().uuid(),
    cursoId: z.string().uuid(),
    nome: z.string().openapi({ example: "Grade 2020.1" }),
    ativo: z.boolean().openapi({ example: true }),
    periodos: z.array(gradePeriodoSchema),
  })
  .openapi("CurriculoGradeResponse");

export function registerCurriculosPaths(registry: OpenAPIRegistry, schemas: CommonSchemas): void {
  const { errorResponses } = schemas;
  registry.registerPath({
    method: "get",
    path: "/curriculos/grade",
    tags: ["Currículos"],
    summary: "Obter a grade curricular ativa de um curso",
    description:
      "Retorna a grade curricular ativa de um curso, organizada por período. Retorna 400 se `cursoId` não for informado e 404 se o curso não tiver grade ativa.",
    request: {
      query: z.object({
        cursoId: z.string().min(1).openapi({
          description: "ID do curso.",
          example: "550e8400-e29b-41d4-a716-446655440000",
        }),
      }),
    },
    responses: {
      200: {
        description: "Grade curricular ativa organizada por período.",
        content: { "application/json": { schema: curriculoGradeResponseSchema } },
      },
      ...errorResponses([400, 404], {
        404: { message: "Currículo ativo não encontrado", code: "NOT_FOUND" },
      }),
    },
  });
}
