import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import {
  sigaaCourseChangeConfirmationRequestSchema,
  sigaaReauthRequestSchema,
  sigaaSyncRequestSchema,
} from "@/lib/server/api-schemas/sigaa";
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
      "Confirma a senha da conta Aquário e emite uma prova separada, limitada ao SIGAA e válida por 15 minutos. proposalId vincula a prova a uma confirmação de curso específica quando informado. A senha e a prova não são persistidas.",
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: requestSchema,
            example: {
              password: "senha-da-conta-aquario",
              proposalId: "550e8400-e29b-41d4-a716-446655440010",
            },
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
  const succeededRunSchema = runSchema.extend({ status: z.literal("SUCCEEDED") }).strict();
  const privateHeaders = {
    "Cache-Control": {
      description: "Respostas SIGAA são privadas e não podem ser armazenadas.",
      schema: { type: "string" as const, const: "private, no-store" },
    },
  };
  const mismatchBase = {
    message: z.string(),
    code: z.literal(ErrorCode.SIGAA_COURSE_MISMATCH),
  };
  const courseMismatchSchema = z
    .discriminatedUnion("resolution", [
      z
        .object({
          ...mismatchBase,
          resolution: z.literal("confirmation_required"),
          proposalId: z.string().uuid(),
          expiresAt: z.string().datetime(),
          currentCourse: z.string(),
          sigaaCourse: z.string(),
          targetCourse: z.string(),
          currentCenter: z.string().optional(),
          targetCenter: z.string().optional(),
        })
        .strict(),
      z
        .object({
          ...mismatchBase,
          resolution: z.literal("blocked"),
          reason: z.enum([
            "source_missing",
            "source_unrecognized",
            "catalog_unavailable",
            "profile_changed",
          ]),
        })
        .strict(),
      z.object({ ...mismatchBase, resolution: z.literal("stale") }).strict(),
    ])
    .openapi("SigaaCourseMismatch");

  registry.registerPath({
    method: "post",
    path: "/usuarios/me/sigaa/sync",
    tags: ["SIGAA"],
    summary: "Sincronizar os dados acadêmicos do dono da sessão",
    description:
      "Exige uma prova recente no cabeçalho X-Sigaa-Reauth-Token. As credenciais SIGAA são usadas uma vez e não são persistidas nem repetidas automaticamente.",
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
                  run: succeededRunSchema,
                  synchronizedAt: z.string().datetime(),
                })
                .strict(),
              z.object({ status: z.literal("replay"), run: succeededRunSchema }).strict(),
            ]),
          },
        },
        headers: privateHeaders,
      },
      ...schemas.errorResponses([400, 401, 403, 429, 500, 502, 503, 504]),
      409: {
        description: "Curso divergente. Somente confirmation_required inclui proposta confirmável.",
        content: {
          "application/json": {
            schema: z.union([courseMismatchSchema, schemas.ApiErrorBodySchema]),
          },
        },
        headers: privateHeaders,
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/usuarios/me/sigaa/course-change/confirm",
    tags: ["SIGAA"],
    summary: "Confirmar substituição irreversível do curso e sincronizar",
    description:
      "Exige uma proposta pendente, uma prova Aquário vinculada ao proposalId, novas credenciais SIGAA e uma nova chave idempotente. Revalida SIGAA, matrícula, perfil e catálogo antes do commit atômico.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: z.object({ "X-Sigaa-Reauth-Token": z.string().min(1) }),
      body: {
        required: true,
        content: {
          "application/json": { schema: sigaaCourseChangeConfirmationRequestSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Curso substituído e snapshot instalado, ou replay da mesma operação.",
        content: {
          "application/json": {
            schema: z.union([
              z
                .object({
                  status: z.literal("synchronized"),
                  run: succeededRunSchema,
                  synchronizedAt: z.string().datetime(),
                  courseReplaced: z.literal(true),
                })
                .strict(),
              z
                .object({
                  status: z.literal("replay"),
                  run: succeededRunSchema,
                  courseReplaced: z.literal(true),
                })
                .strict(),
            ]),
          },
        },
        headers: privateHeaders,
      },
      ...schemas.errorResponses([400, 401, 403, 429, 500, 502, 503, 504]),
      409: {
        description: "Proposta stale, dados frescos divergentes ou sincronização concorrente.",
        content: {
          "application/json": {
            schema: z.union([courseMismatchSchema, schemas.ApiErrorBodySchema]),
          },
        },
        headers: privateHeaders,
      },
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
