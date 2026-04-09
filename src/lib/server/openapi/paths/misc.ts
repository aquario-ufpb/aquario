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

  registry.registerPath({
    method: "get",
    path: "/content-images/{path}",
    tags: ["Content Images"],
    summary: "Serve a static image from the content submodules",
    description:
      "Public endpoint that serves static images (illustrations, entity logos, map assets) from the `content/` git submodules. The path is **resolved using slug matching**, so you can reference folders/files by their lowercased, accent-stripped, hyphen-joined names rather than the actual filesystem paths (which may include priority prefixes like `'1 - Componentes Curriculares'`).\n\n**Supported path roots (the first segment chooses the content submodule):**\n- `entidades/<file>` — serves from `content/aquario-entidades/centro-de-informatica`\n- `assets/entidades/<file>` — serves from `content/aquario-entidades/centro-de-informatica/assets`\n- `mapas/<path>` — serves from `content/aquario-mapas`\n- (anything else) — serves from `content/aquario-guias/centro-de-informatica` (default)\n\n**Unlike every other endpoint in this API, error responses for this endpoint are plain text (`'Image not found'`, `'Forbidden'`, `'Internal Server Error'`) — NOT the standard `ApiErrorBody` JSON shape.** This keeps the endpoint compatible with `<img>` tags and avoids any JSON parsing on the client side.\n\nResponses include `Cache-Control: public, max-age=31536000, immutable` — the browser can cache the image permanently.",
    request: {
      params: z.object({
        path: z.string().openapi({
          description:
            "Slash-joined path segments. Next.js catch-all route — any number of segments is accepted. Slugs are matched case-insensitively against folder/file names with priority prefixes stripped.",
          example: "entidades/pet-computacao.png",
        }),
      }),
    },
    responses: {
      200: {
        description:
          "Image file served as binary data. The `Content-Type` header reflects the actual file format; `application/octet-stream` is used as a fallback for unknown extensions.",
        headers: {
          "Content-Type": {
            description: "MIME type of the served image, derived from the file extension.",
            schema: { type: "string", example: "image/png" },
          },
          "Cache-Control": {
            description: "Long-lived immutable cache directive (1 year).",
            schema: { type: "string", example: "public, max-age=31536000, immutable" },
          },
        },
        content: {
          "image/png": { schema: { type: "string", format: "binary" } },
          "image/jpeg": { schema: { type: "string", format: "binary" } },
          "image/gif": { schema: { type: "string", format: "binary" } },
          "image/webp": { schema: { type: "string", format: "binary" } },
          "image/svg+xml": { schema: { type: "string", format: "binary" } },
          "application/octet-stream": { schema: { type: "string", format: "binary" } },
        },
      },
      403: {
        description:
          "Forbidden — the resolved path is outside the allowed content directory. Body is the plain text string 'Forbidden', NOT the standard JSON error shape.",
        content: {
          "text/plain": {
            schema: { type: "string", example: "Forbidden" },
          },
        },
      },
      404: {
        description:
          "Image not found at the resolved path. Body is the plain text string 'Image not found', NOT the standard JSON error shape.",
        content: {
          "text/plain": {
            schema: { type: "string", example: "Image not found" },
          },
        },
      },
      500: {
        description:
          "Internal error while reading the image. Body is the plain text string 'Internal Server Error', NOT the standard JSON error shape.",
        content: {
          "text/plain": {
            schema: { type: "string", example: "Internal Server Error" },
          },
        },
      },
    },
  });
}
