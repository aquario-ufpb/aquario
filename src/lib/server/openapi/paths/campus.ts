import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import type { CommonSchemas } from "../common-schemas";

/**
 * Campus response shape. Handlers validate request bodies inline (no Zod),
 * so request/response shapes are defined here.
 */
const campusResponseSchema = z
  .object({
    id: z.string().uuid(),
    nome: z.string().openapi({ example: "Campus I - João Pessoa" }),
  })
  .openapi("CampusResponse");

const createOrUpdateCampusSchema = z
  .object({
    nome: z.string().min(1).openapi({ example: "Campus I - João Pessoa" }),
  })
  .openapi("CreateOrUpdateCampusRequest");

export function registerCampusPaths(registry: OpenAPIRegistry, schemas: CommonSchemas): void {
  const { errorResponses } = schemas;
  registry.registerPath({
    method: "get",
    path: "/campus",
    tags: ["Campus"],
    summary: "List all campi",
    description:
      "Public endpoint returning all UFPB campi. UFPB has multiple campi across the state of Paraíba.",
    responses: {
      200: {
        description: "List of all campi.",
        content: { "application/json": { schema: z.array(campusResponseSchema) } },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/campus",
    tags: ["Campus"],
    summary: "Create a new campus (admin only)",
    description:
      "Admin-only endpoint to create a new campus. Returns 409 if a campus with the same name already exists.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createOrUpdateCampusSchema,
            example: { nome: "Campus IV - Rio Tinto" },
          },
        },
      },
    },
    responses: {
      201: {
        description: "Campus created.",
        content: { "application/json": { schema: campusResponseSchema } },
      },
      ...errorResponses([400, 409]),
    },
  });

  registry.registerPath({
    method: "put",
    path: "/campus/{id}",
    tags: ["Campus"],
    summary: "Update a campus (admin only)",
    description: "Admin-only endpoint to rename a campus.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        required: true,
        content: {
          "application/json": {
            schema: createOrUpdateCampusSchema,
            example: { nome: "Campus I - João Pessoa" },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Campus updated.",
        content: { "application/json": { schema: campusResponseSchema } },
      },
      ...errorResponses([400, 404]),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/campus/{id}",
    tags: ["Campus"],
    summary: "Delete a campus (admin only)",
    description:
      "Admin-only endpoint to delete a campus. **Returns 409 with `HAS_DEPENDENCIES` if there are academic centers linked to this campus** — you must delete/reassign linked centers first.",
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: "Campus deleted.",
        content: {
          "application/json": {
            schema: z.object({ success: z.literal(true) }),
            example: { success: true },
          },
        },
      },
      ...errorResponses([404, 409]),
    },
  });
}
