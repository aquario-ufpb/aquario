import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import type { CommonSchemas } from "../common-schemas";

/**
 * Curso (course/major) response shape. The handlers do not use Zod schemas
 * for request validation (they check fields inline), so we define request
 * and response schemas here directly.
 */
const cursoResponseSchema = z
  .object({
    id: z.string().uuid(),
    nome: z.string().openapi({ example: "Ciência da Computação" }),
    centroId: z.string().uuid(),
  })
  .openapi("CursoResponse");

const createOrUpdateCursoSchema = z
  .object({
    nome: z.string().min(1).openapi({ example: "Ciência da Computação" }),
    centroId: z.string().uuid().openapi({ example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }),
  })
  .openapi("CreateOrUpdateCursoRequest");

export function registerCursosPaths(registry: OpenAPIRegistry, schemas: CommonSchemas): void {
  const { errorResponses } = schemas;
  registry.registerPath({
    method: "get",
    path: "/cursos",
    tags: ["Courses"],
    summary: "List all courses",
    description:
      "Public endpoint returning all courses (majors) across all centros. Used by the registration form, curriculum browser and search.",
    responses: {
      200: {
        description: "List of all courses.",
        content: { "application/json": { schema: z.array(cursoResponseSchema) } },
      },
      ...errorResponses([500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/cursos",
    tags: ["Courses"],
    summary: "Create a new course (admin only)",
    description:
      "Admin-only endpoint to create a new course. Both `nome` and `centroId` are required.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createOrUpdateCursoSchema,
            example: {
              nome: "Sistemas de Informação",
              centroId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "Course created.",
        content: { "application/json": { schema: cursoResponseSchema } },
      },
      ...errorResponses([400, 401, 403, 500]),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/cursos/{id}",
    tags: ["Courses"],
    summary: "Update a course (admin only)",
    description: "Admin-only endpoint to update a course's name and/or centro.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createOrUpdateCursoSchema,
            example: {
              nome: "Ciência da Computação",
              centroId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Course updated.",
        content: { "application/json": { schema: cursoResponseSchema } },
      },
      ...errorResponses([400, 401, 403, 404, 500]),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/cursos/{id}",
    tags: ["Courses"],
    summary: "Delete a course (admin only)",
    description:
      "Admin-only endpoint to delete a course. **Returns 409 with `HAS_DEPENDENCIES` if there are curriculos, guias, or usuarios linked to this course** — you must remove/reassign dependencies before deleting. The error message lists the counts.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Course deleted.",
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
}
