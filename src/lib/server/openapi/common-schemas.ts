import { z } from "zod";
import type { OpenAPIRegistry, ResponseConfig } from "@asteasolutions/zod-to-openapi";

import { ErrorCode } from "@/lib/shared/errors/error-codes";

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
  errorResponses: (codes: number[]) => Record<string, ResponseConfig>;
};

/**
 * Default descriptions for well-known HTTP status codes used in the API.
 * Pure data, kept module-level since it has no lifecycle.
 */
const STATUS_DESCRIPTIONS: Record<number, string> = {
  400: "Validation error",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not found",
  409: "Conflict",
  429: "Rate limited",
  500: "Internal server error",
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
      description: "Machine-readable error code returned in every error response.",
      example: ErrorCode.VALIDATION_ERROR,
    })
  );

  const FieldErrorSchema = registry.register(
    "FieldError",
    z
      .object({
        field: z.string().openapi({
          description: "Dot-notation path to the field that failed validation.",
          example: "email",
        }),
        message: z.string().openapi({
          description: "Human-readable message describing the validation failure.",
          example: "Email inválido",
        }),
      })
      .openapi({
        description: "Details about a single field-level validation failure.",
      })
  );

  const ApiErrorBodySchema = registry.register(
    "ApiErrorBody",
    z
      .object({
        message: z.string().openapi({
          description: "Human-readable error message, localized in Portuguese.",
          example: "Email inválido",
        }),
        code: ErrorCodeSchema.openapi({
          description: "Machine-readable error code. See the ErrorCode enum.",
        }),
        errors: z.array(FieldErrorSchema).optional().openapi({
          description: "Field-level validation errors (present only for VALIDATION_ERROR).",
        }),
      })
      .openapi({
        description: "Standard error response returned for every 4xx and 5xx status code.",
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
        description: "Pagination metadata returned alongside paginated result lists.",
      })
  );

  /**
   * Closure over ApiErrorBodySchema so every response returned by this helper
   * references the same schema registered above. Fresh on every call, which
   * eliminates the risk of cross-registry schema leakage.
   */
  function errorResponses(codes: number[]): Record<string, ResponseConfig> {
    const responses: Record<string, ResponseConfig> = {};
    for (const code of codes) {
      const description = STATUS_DESCRIPTIONS[code];
      if (!description) {
        throw new Error(
          `errorResponses(): unknown status code ${code}. Add it to STATUS_DESCRIPTIONS in common-schemas.ts.`
        );
      }
      responses[String(code)] = {
        description,
        content: {
          "application/json": {
            schema: ApiErrorBodySchema,
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
