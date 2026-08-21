import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { sigaaReauthRequestSchema, sigaaSyncRequestSchema } from "@/lib/server/api-schemas/sigaa";
import { sigaaAcademicSnapshotPayloadSchema } from "@/lib/server/services/sigaa/storage.types";
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

  const runSchema = z
    .object({
      id: z.string().uuid(),
      status: z.enum(["RUNNING", "SUCCEEDED", "FAILED", "SUPERSEDED"]),
      failureCode: z.string().nullable(),
      connectorRequestId: z.string().nullable(),
      startedAt: z.string().datetime(),
      finishedAt: z.string().datetime().nullable(),
    })
    .strict()
    .openapi("SigaaSyncRun");
  const privateHeaders = {
    "Cache-Control": {
      description: "Respostas SIGAA são privadas e não podem ser armazenadas.",
      schema: { type: "string" as const, const: "private, no-store" },
    },
  };

  registry.registerPath({
    method: "post",
    path: "/usuarios/me/sigaa/sync",
    tags: ["SIGAA"],
    summary: "Sincronizar os dados acadêmicos do dono da sessão",
    description:
      "Exige participação na beta e uma prova recente no cabeçalho X-Sigaa-Reauth-Token. As credenciais SIGAA são usadas uma vez e não são persistidas nem repetidas automaticamente.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: z.object({ "X-Sigaa-Reauth-Token": z.string().min(1) }),
      body: {
        required: true,
        content: { "application/json": { schema: sigaaSyncRequestSchema } },
      },
    },
    responses: {
      200: {
        description: "Snapshot instalado ou tentativa idempotente existente.",
        content: {
          "application/json": {
            schema: z.union([
              z
                .object({
                  status: z.literal("synchronized"),
                  run: runSchema,
                  synchronizedAt: z.string().datetime(),
                })
                .strict(),
              z.object({ status: z.literal("replay"), run: runSchema }).strict(),
            ]),
          },
        },
        headers: privateHeaders,
      },
      ...schemas.errorResponses([400, 401, 403, 409, 429, 500, 502, 503, 504]),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/usuarios/me/academico",
    tags: ["SIGAA"],
    summary: "Ler o último retrato acadêmico importado",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "Estado importado do dono da sessão.",
        content: {
          "application/json": {
            schema: z
              .object({
                matricula: z
                  .object({
                    value: z.string().nullable(),
                    origin: z.enum(["LEGACY", "MANUAL", "SIGAA"]).nullable(),
                    verifiedAt: z.string().datetime().nullable(),
                  })
                  .strict(),
                connection: z
                  .object({
                    status: z.enum(["PENDING", "CONNECTED", "DISCONNECTED"]),
                    consentVersion: z.string().nullable(),
                    consentedAt: z.string().datetime().nullable(),
                    connectedAt: z.string().datetime().nullable(),
                    disconnectedAt: z.string().datetime().nullable(),
                  })
                  .strict()
                  .nullable(),
                snapshot: z
                  .object({
                    contractVersion: z.string(),
                    connectorObservedAt: z.string().datetime(),
                    synchronizedAt: z.string().datetime(),
                    upstreamCommit: z.string(),
                    installedByRunId: z.string().nullable(),
                    payload: sigaaAcademicSnapshotPayloadSchema,
                  })
                  .strict()
                  .nullable(),
              })
              .strict()
              .openapi("SigaaImportedAcademicState"),
          },
        },
        headers: privateHeaders,
      },
      ...schemas.errorResponses([401, 403, 500]),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/usuarios/me/sigaa/disconnect",
    tags: ["SIGAA"],
    summary: "Desconectar o SIGAA preservando o snapshot",
    security: [{ bearerAuth: [] }],
    request: { headers: z.object({ "X-Sigaa-Reauth-Token": z.string().min(1) }) },
    responses: {
      200: {
        description: "Conexão desativada sem remover dados importados.",
        content: {
          "application/json": {
            schema: z
              .object({ status: z.literal("disconnected"), disconnectedAt: z.string().datetime() })
              .strict(),
          },
        },
        headers: privateHeaders,
      },
      ...schemas.errorResponses([401, 403, 429, 500]),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/usuarios/me/sigaa/data",
    tags: ["SIGAA"],
    summary: "Excluir somente os dados importados do SIGAA",
    security: [{ bearerAuth: [] }],
    request: { headers: z.object({ "X-Sigaa-Reauth-Token": z.string().min(1) }) },
    responses: {
      200: {
        description: "Conexão, snapshot e tentativas removidos.",
        content: {
          "application/json": {
            schema: z
              .object({
                status: z.literal("deleted"),
                hadImportedData: z.boolean(),
                matriculaCleared: z.boolean(),
              })
              .strict(),
          },
        },
        headers: privateHeaders,
      },
      ...schemas.errorResponses([401, 403, 429, 500]),
    },
  });
}
