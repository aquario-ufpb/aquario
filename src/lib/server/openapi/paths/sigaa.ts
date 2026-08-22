import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { sigaaReauthRequestSchema } from "@/lib/server/api-schemas/sigaa";
import { ErrorCode } from "@/lib/shared/errors";

import type { CommonSchemas } from "../common-schemas";

export function registerSigaaPaths(registry: OpenAPIRegistry, schemas: CommonSchemas): void {
  const requestSchema = sigaaReauthRequestSchema.openapi("SigaaReauthRequest");
  const responseSchema = z
    .object({
      proofToken: z.string().openapi({
        description:
          "JWT de reautenticação com finalidade SIGAA. Deve permanecer somente em memória.",
      }),
      expiresAt: z.string().datetime().openapi({
        description: "Expiração da prova, sempre 15 minutos após a reautenticação.",
        example: "2026-08-21T15:15:00.000Z",
      }),
    })
    .openapi("SigaaReauthResponse");

  registry.registerPath({
    method: "post",
    path: "/usuarios/me/sigaa/reauth",
    tags: ["SIGAA"],
    summary: "Reautenticar para operações SIGAA",
    description:
      "Confirma a senha da conta Aquário e emite uma prova separada, limitada ao SIGAA e válida por 15 minutos. A conta precisa participar da beta SIGAA. A senha e a prova não são persistidas.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: requestSchema,
            example: { password: "senha-da-conta-aquario" },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Prova recente emitida.",
        content: {
          "application/json": {
            schema: responseSchema,
          },
        },
        headers: {
          "Cache-Control": {
            description: "Respostas SIGAA são privadas e não podem ser armazenadas.",
            schema: { type: "string", const: "private, no-store" },
          },
        },
      },
      ...schemas.errorResponses([400, 401, 403, 429, 503], {
        400: {
          message: "Senha do Aquário é obrigatória",
          code: ErrorCode.VALIDATION_ERROR,
        },
        401: {
          message: "Token inválido ou expirado",
          code: ErrorCode.TOKEN_INVALID,
        },
        403: {
          message: "Senha do Aquário incorreta.",
          code: ErrorCode.SIGAA_REAUTH_FAILED,
        },
        429: {
          message: "Muitas tentativas de reautenticação. Tente novamente mais tarde.",
          code: ErrorCode.SIGAA_REAUTH_RATE_LIMITED,
        },
        503: {
          message: "A reautenticação SIGAA está temporariamente indisponível.",
          code: ErrorCode.SIGAA_REAUTH_UNAVAILABLE,
        },
      }),
    },
  });
}
