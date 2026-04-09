import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import type { CommonSchemas } from "../common-schemas";

/**
 * Discipline inside a curriculum grid — summary fields only.
 */
const gradeDisciplinaSchema = z
  .object({
    id: z.string().uuid(),
    codigo: z.string().openapi({ example: "DCE1001" }),
    nome: z.string().openapi({ example: "Introdução à Computação" }),
    cargaHoraria: z.number().int().optional(),
    creditos: z.number().int().optional(),
    natureza: z.enum(["OBRIGATORIA", "OPTATIVA", "ELETIVA", "COMPLEMENTAR"]).optional().openapi({
      description: "Discipline nature inside this curriculum (required, optional, etc).",
      example: "OBRIGATORIA",
    }),
  })
  .openapi("GradeDisciplina");

/**
 * A single period/semester in a curriculum grid, containing the disciplines
 * that should be taken during that period.
 */
const gradePeriodoSchema = z
  .object({
    periodo: z.number().int().openapi({ example: 1 }),
    disciplinas: z.array(gradeDisciplinaSchema),
  })
  .openapi("GradePeriodo");

/**
 * Full curriculum grid response. The shape is the one returned by
 * curriculosRepository.findActiveGradeByCursoId — an active grade per course.
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
    tags: ["Curricula"],
    summary: "Get the active curriculum grid for a course",
    description:
      "Public endpoint returning the currently active curriculum grid for a specific course, organized by semester. Used by the curriculum browser page to display the discipline tree. Requires the `cursoId` query parameter — returns 400 if missing and 404 if no active grid exists for that course.",
    request: {
      query: z.object({
        cursoId: z.string().uuid().openapi({
          description: "Course id to fetch the active curriculum grid for.",
          example: "550e8400-e29b-41d4-a716-446655440000",
        }),
      }),
    },
    responses: {
      200: {
        description: "Active curriculum grid organized by period.",
        content: { "application/json": { schema: curriculoGradeResponseSchema } },
      },
      ...errorResponses([400, 404, 500]),
    },
  });
}
