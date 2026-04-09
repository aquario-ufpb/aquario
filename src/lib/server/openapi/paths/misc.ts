import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { errorResponses } from "../common-schemas";

/**
 * Miscellaneous endpoints that don't fit into any specific resource group:
 * health check, file upload, and static content image serving.
 *
 * These are registered together to avoid creating three separate files for
 * one endpoint each. Content-images is added in a later commit of this PR.
 */

const healthResponseSchema = z
  .object({
    status: z.literal("ok").openapi({
      description: "Service health indicator. Always 'ok' when the service is reachable.",
      example: "ok",
    }),
  })
  .openapi("HealthResponse");

/**
 * Multipart form body schema for POST /upload/photo. The file must be sent
 * as a multipart/form-data field named `file`. Zod doesn't have a native
 * binary primitive, so we use `z.unknown()` with an explicit openapi override.
 */
const uploadPhotoBodySchema = z
  .object({
    file: z.unknown().openapi({
      type: "string",
      format: "binary",
      description: "Image file to upload. Max 5MB. Allowed MIME types: JPEG, PNG, WebP, GIF.",
    }),
  })
  .openapi("UploadPhotoBody");

/**
 * Reuses the same user profile shape returned by /auth/me and /usuarios/slug/{slug}.
 * Kept minimal here since the full profile schema lives in paths/usuarios.ts.
 */
const uploadPhotoResponseSchema = z
  .object({
    id: z.string().uuid(),
    nome: z.string(),
    email: z.string().nullable(),
    slug: z.string().nullable(),
    papelPlataforma: z.enum(["USER", "MASTER_ADMIN"]),
    eVerificado: z.boolean(),
    urlFotoPerfil: z.string().nullable().openapi({
      description: "URL of the newly uploaded photo in blob storage.",
      example: "https://blob.vercel-storage.com/photos/550e8400-1712668800.webp",
    }),
    periodoAtual: z.string().nullable().optional(),
    centro: z.object({ id: z.string().uuid(), nome: z.string(), sigla: z.string() }),
    curso: z.object({ id: z.string().uuid(), nome: z.string() }),
    permissoes: z.array(z.string()),
  })
  .openapi("UploadPhotoResponse");

export function registerMiscPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "get",
    path: "/health",
    tags: ["Health"],
    summary: "Service health check",
    description:
      "Simple liveness probe for the API service. Returns HTTP 200 with `{ status: 'ok' }` when the service is reachable. Use this for uptime monitoring and load balancer health checks.",
    responses: {
      200: {
        description: "Service is healthy.",
        content: {
          "application/json": {
            schema: healthResponseSchema,
            example: { status: "ok" },
          },
        },
      },
      ...errorResponses([500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/upload/photo",
    tags: ["Upload"],
    summary: "Upload a profile photo for the current user",
    description:
      "Atomically upload a profile photo and update the user's `urlFotoPerfil` field. The previous photo (if hosted on blob storage) is deleted as part of the operation. On any failure after upload, the newly-uploaded file is cleaned up to keep storage and database in sync.\n\n**File constraints:**\n- Max size: **5 MB**\n- Allowed MIME types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/gif`\n- The filename is ignored server-side — a safe extension is derived from the MIME type.\n\nReturns the updated user profile on success.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: uploadPhotoBodySchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Photo uploaded and user profile updated.",
        content: { "application/json": { schema: uploadPhotoResponseSchema } },
      },
      ...errorResponses([400, 401, 500]),
    },
  });
}
