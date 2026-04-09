import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import type { CommonSchemas } from "../common-schemas";

/**
 * Centro (academic center, e.g., Centro de Informática) response shape.
 * Handlers validate request bodies inline rather than with Zod schemas, so
 * request/response shapes are defined here.
 */
const centroResponseSchema = z
  .object({
    id: z.string().uuid(),
    nome: z.string().openapi({ example: "Centro de Informática" }),
    sigla: z.string().openapi({ example: "CI" }),
    descricao: z.string().nullable().optional(),
    campusId: z.string().uuid(),
  })
  .openapi("CentroResponse");

const createOrUpdateCentroSchema = z
  .object({
    nome: z.string().min(1).openapi({ example: "Centro de Informática" }),
    sigla: z.string().min(1).openapi({ example: "CI" }),
    descricao: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "Centro responsável pelos cursos de computação na UFPB." }),
    campusId: z.string().uuid().openapi({ example: "b2c3d4e5-f6a7-8901-bcde-f23456789012" }),
  })
  .openapi("CreateOrUpdateCentroRequest");

/**
 * Simplified curso shape returned by GET /centros/{id}/cursos.
 */
const centroCursoSchema = z
  .object({
    id: z.string().uuid(),
    nome: z.string(),
    centroId: z.string().uuid(),
  })
  .openapi("CentroCurso");

export function registerCentrosPaths(registry: OpenAPIRegistry, schemas: CommonSchemas): void {
  const { errorResponses } = schemas;
  registry.registerPath({
    method: "get",
    path: "/centros",
    tags: ["Academic Centers"],
    summary: "List all academic centers",
    description:
      "Public endpoint returning all academic centers (e.g., Centro de Informática, Centro de Ciências Exatas) across all campi.",
    responses: {
      200: {
        description: "List of all centers.",
        content: { "application/json": { schema: z.array(centroResponseSchema) } },
      },
      ...errorResponses([500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/centros",
    tags: ["Academic Centers"],
    summary: "Create a new academic center (admin only)",
    description: "Admin-only endpoint to create a new academic center.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createOrUpdateCentroSchema,
            example: {
              nome: "Centro de Informática",
              sigla: "CI",
              descricao:
                "Responsável pelos cursos de Ciência da Computação e Sistemas de Informação.",
              campusId: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "Center created.",
        content: { "application/json": { schema: centroResponseSchema } },
      },
      ...errorResponses([400, 401, 403, 500]),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/centros/{id}",
    tags: ["Academic Centers"],
    summary: "Update an academic center (admin only)",
    description: "Admin-only endpoint to update an academic center.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createOrUpdateCentroSchema,
            example: {
              nome: "Centro de Informática",
              sigla: "CI",
              descricao: "Centro atualizado.",
              campusId: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Center updated.",
        content: { "application/json": { schema: centroResponseSchema } },
      },
      ...errorResponses([400, 401, 403, 404, 500]),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/centros/{id}",
    tags: ["Academic Centers"],
    summary: "Delete an academic center (admin only)",
    description:
      "Admin-only endpoint to delete an academic center. **Returns 409 with `HAS_DEPENDENCIES` if there are courses linked to this center** — you must delete/reassign linked courses first.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Center deleted.",
        content: {
          "application/json": {
            schema: z.object({ success: z.literal(true) }),
            example: { success: true },
          },
        },
      },
      ...errorResponses([401, 403, 404, 409, 500]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/centros/{id}/cursos",
    tags: ["Academic Centers"],
    summary: "List courses for a specific center",
    description: "Public endpoint returning all courses (majors) offered by the specified center.",
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "List of courses for this center.",
        content: { "application/json": { schema: z.array(centroCursoSchema) } },
      },
      ...errorResponses([500]),
    },
  });
}
