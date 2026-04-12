import { z } from "zod";
import type { OpenAPIRegistry, ResponseConfig } from "@asteasolutions/zod-to-openapi";

import { ErrorCode } from "@/lib/shared/errors/error-codes";

/** Tipo utilitário: valores possíveis do enum ErrorCode. */
type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Reusable component schemas shared across every path.
 *
 * Unlike an earlier version of this file, schemas are no longer registered as
 * module-level side effects: calling `registerCommonSchemas(registry)` now
 * both registers the schemas on the given registry AND returns fresh Zod
 * references that can be reused by path definitions built around the same
 * registry. This keeps the registry ephemeral (see registry.ts) and makes
 * `getOpenApiDocument()` a pure function of the deployed code.
 */

/**
 * The set of references returned by `registerCommonSchemas`. Path modules
 * receive this object as their second argument so they can reference the
 * shared error body schema and build consistent error responses without
 * importing anything from the module graph that might depend on a specific
 * registry instance.
 */
export type CommonSchemas = {
  ErrorCodeSchema: z.ZodTypeAny;
  FieldErrorSchema: z.ZodTypeAny;
  ApiErrorBodySchema: z.ZodTypeAny;
  PaginationMetaSchema: z.ZodTypeAny;
  /**
   * Build a map of common error responses referencing the shared
   * `ApiErrorBody` component. Returned as a closure so each call captures
   * the ApiErrorBody schema bound to the enclosing registry.
   */
  errorResponses: (
    codes: number[],
    examples?: Partial<Record<number, { message: string; code: ErrorCodeValue }>>
  ) => Record<string, ResponseConfig>;
};

/**
 * Default descriptions for well-known HTTP status codes used in the API.
 * Pure data, kept module-level since it has no lifecycle.
 */
const STATUS_DESCRIPTIONS: Record<number, string> = {
  400: "Erro de validação",
  401: "Não autorizado",
  403: "Sem permissão",
  404: "Não encontrado",
  409: "Conflito",
  429: "Limite de requisições excedido",
  500: "Erro interno do servidor",
};

/**
 * Register the shared component schemas on the given registry and return the
 * Zod references that path definitions should use.
 *
 * IMPORTANT: call this exactly once per registry, before any `registerPath`
 * calls, so paths can safely reference the returned schemas. The schemas
 * themselves are instantiated freshly on every invocation — no two calls
 * share Zod instances — so there is no risk of cross-registry state leakage.
 */
export function registerCommonSchemas(registry: OpenAPIRegistry): CommonSchemas {
  const ErrorCodeSchema = registry.register(
    "ErrorCode",
    z.enum(Object.values(ErrorCode) as [string, ...string[]]).openapi({
      description: "Código de erro legível por máquina, retornado em toda resposta de erro.",
      example: ErrorCode.VALIDATION_ERROR,
    })
  );

  const FieldErrorSchema = registry.register(
    "FieldError",
    z
      .object({
        field: z.string().openapi({
          description: "Caminho (dot-notation) do campo que falhou na validação.",
          example: "email",
        }),
        message: z.string().openapi({
          description: "Mensagem legível descrevendo a falha de validação.",
          example: "Email inválido",
        }),
      })
      .openapi({
        description: "Detalhes de uma falha de validação em um campo específico.",
      })
  );

  const ApiErrorBodySchema = registry.register(
    "ApiErrorBody",
    z
      .object({
        message: z.string().openapi({
          description: "Mensagem de erro legível, em português.",
          example: "Email inválido",
        }),
        code: ErrorCodeSchema.openapi({
          description: "Código de erro legível por máquina. Ver o enum ErrorCode.",
        }),
        errors: z.array(FieldErrorSchema).optional().openapi({
          description: "Erros de validação por campo (presente apenas em VALIDATION_ERROR).",
        }),
      })
      .openapi({
        description: "Formato padrão de resposta de erro retornado em todo 4xx e 5xx.",
      })
  );

  const PaginationMetaSchema = registry.register(
    "PaginationMeta",
    z
      .object({
        page: z.number().int().positive().openapi({ example: 1 }),
        limit: z.number().int().positive().openapi({ example: 25 }),
        total: z.number().int().nonnegative().openapi({ example: 342 }),
        totalPages: z.number().int().nonnegative().openapi({ example: 14 }),
      })
      .openapi({
        description: "Metadados de paginação retornados junto com listas paginadas.",
      })
  );

  /**
   * Closure over ApiErrorBodySchema so every response returned by this helper
   * references the same schema registered above. Fresh on every call, which
   * eliminates the risk of cross-registry schema leakage.
   */
  function errorResponses(
    codes: number[],
    examples?: Partial<Record<number, { message: string; code: ErrorCodeValue }>>
  ): Record<string, ResponseConfig> {
    const responses: Record<string, ResponseConfig> = {};
    for (const code of codes) {
      const description = STATUS_DESCRIPTIONS[code];
      if (!description) {
        throw new Error(
          `errorResponses(): unknown status code ${code}. Add it to STATUS_DESCRIPTIONS in common-schemas.ts.`
        );
      }
      const example = examples?.[code];
      responses[String(code)] = {
        description,
        content: {
          "application/json": {
            schema: ApiErrorBodySchema,
            ...(example && { example }),
          },
        },
      };
    }
    return responses;
  }

  return {
    ErrorCodeSchema,
    FieldErrorSchema,
    ApiErrorBodySchema,
    PaginationMetaSchema,
    errorResponses,
  };
}
