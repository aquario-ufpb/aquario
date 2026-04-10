import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import type { CommonSchemas } from "../common-schemas";

/**
 * Endpoints diversos que não se encaixam em nenhum grupo de recurso específico:
 * health check, upload de arquivos e serviço de imagens estáticas dos
 * submódulos de conteúdo.
 *
 * Registrados juntos para evitar criar três arquivos separados de 1 endpoint cada.
 */

/** Shape de resposta do health check. */
const healthResponseSchema = z
  .object({
    status: z.literal("ok").openapi({
      description: "Indicador de saúde do serviço. Sempre 'ok' quando o serviço está acessível.",
      example: "ok",
    }),
  })
  .openapi("HealthResponse");

/**
 * Schema do corpo multipart para POST /upload/photo. O arquivo deve ser enviado
 * como campo `file` em multipart/form-data. Zod não tem primitivo binário
 * nativo, então usamos `z.unknown()` com override explícito do openapi.
 */
const uploadPhotoBodySchema = z
  .object({
    file: z.unknown().openapi({
      type: "string",
      format: "binary",
      description:
        "Arquivo de imagem para upload. Máximo 5MB. MIME types aceitos: JPEG, PNG, WebP, GIF.",
    }),
  })
  .openapi("UploadPhotoBody");

/**
 * Reusa o mesmo shape de perfil retornado por /auth/me e /usuarios/slug/{slug}.
 * Mantido mínimo aqui — o schema completo de perfil vive em paths/usuarios.ts.
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
      description: "URL da foto recém-enviada no blob storage.",
      example: "https://blob.vercel-storage.com/photos/550e8400-1712668800.webp",
    }),
    periodoAtual: z.string().nullable().optional(),
    centro: z.object({ id: z.string().uuid(), nome: z.string(), sigla: z.string() }),
    curso: z.object({ id: z.string().uuid(), nome: z.string() }),
    permissoes: z.array(z.string()),
  })
  .openapi("UploadPhotoResponse");

/** Registra os paths diversos (health, upload, imagens de conteúdo) no registry OpenAPI. */
export function registerMiscPaths(registry: OpenAPIRegistry, schemas: CommonSchemas): void {
  const { errorResponses } = schemas;
  registry.registerPath({
    method: "get",
    path: "/health",
    tags: ["Health"],
    summary: "Health check do serviço",
    description:
      "Liveness probe simples da API. Retorna HTTP 200 com `{ status: 'ok' }` quando o serviço está acessível. Útil para monitoramento de uptime e health checks de load balancer.",
    responses: {
      200: {
        description: "Serviço saudável.",
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
    summary: "Enviar foto de perfil do usuário atual",
    description:
      "Faz upload de uma foto (máximo 5MB, JPEG/PNG/WebP/GIF) e atualiza o perfil do usuário atomicamente. Retorna o usuário atualizado.",
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
        description: "Foto enviada e perfil atualizado.",
        content: { "application/json": { schema: uploadPhotoResponseSchema } },
      },
      ...errorResponses([400]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/content-images/{path}",
    tags: ["Imagens de Conteúdo"],
    summary: "Servir imagem estática dos submódulos de conteúdo",
    description:
      "Serve uma imagem estática dos submódulos git em `content/`. O path usa slug matching (sem acentos, prefixos de prioridade ignorados). Roots suportados: `entidades/*`, `assets/entidades/*`, `mapas/*`, ou padrão (guias). **Erros retornam texto plano**, não JSON — compatível com tags `<img>`.",
    request: {
      params: z.object({
        path: z.string().openapi({
          description: "Segmentos de path concatenados por barra (catch-all).",
          example: "entidades/pet-computacao.png",
        }),
      }),
    },
    responses: {
      200: {
        description: "Imagem binária. Cacheada por 1 ano (`Cache-Control: immutable`).",
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
        description: "Imagem não encontrada (corpo em texto plano).",
        content: {
          "text/plain": {
            schema: { type: "string", example: "Image not found" },
          },
        },
      },
    },
  });
}
