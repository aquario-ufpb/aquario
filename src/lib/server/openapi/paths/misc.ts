import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import type { CommonSchemas } from "../common-schemas";

/**
 * Miscellaneous endpoints that don't fit into any specific resource group:
 * health check, file upload, and static content image serving.
 *
 * These are registered together to avoid creating three separate files for
 * one endpoint each.
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

export function registerMiscPaths(registry: OpenAPIRegistry, schemas: CommonSchemas): void {
  const { errorResponses } = schemas;
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
    },
  });

  registry.registerPath({
    method: "post",
    path: "/upload/photo",
    tags: ["Upload"],
    summary: "Upload a profile photo for the current user",
    description:
      "Upload a photo (max 5 MB, JPEG/PNG/WebP/GIF) and atomically update the user's profile. Returns the updated user.",
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
      ...errorResponses([400]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/content-images/{path}",
    tags: ["Content Images"],
    summary: "Serve a static image from the content submodules",
    description:
      "Serve a static image from `content/` git submodules. Path uses slug matching (accent-stripped, priority prefixes ignored). Supported roots: `entidades/*`, `assets/entidades/*`, `mapas/*`, or default (guias). **Errors return plain text**, not JSON — compatible with `<img>` tags.",
    request: {
      params: z.object({
        path: z.string().openapi({
          description: "Slash-joined path segments (catch-all).",
          example: "entidades/pet-computacao.png",
        }),
      }),
    },
    responses: {
      200: {
        description: "Image binary. Cached for 1 year (`Cache-Control: immutable`).",
        content: {
          "image/png": { schema: { type: "string", format: "binary" } },
          "image/jpeg": { schema: { type: "string", format: "binary" } },
          "image/gif": { schema: { type: "string", format: "binary" } },
          "image/webp": { schema: { type: "string", format: "binary" } },
          "image/svg+xml": { schema: { type: "string", format: "binary" } },
          "application/octet-stream": { schema: { type: "string", format: "binary" } },
        },
      },
      404: {
        description: "Image not found (plain text body).",
        content: {
          "text/plain": {
            schema: { type: "string", example: "Image not found" },
          },
        },
      },
    },
  });
}
