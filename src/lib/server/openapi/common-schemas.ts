import { z } from "zod";
import type { ResponseConfig } from "@asteasolutions/zod-to-openapi";

import { ErrorCode } from "@/lib/shared/errors/error-codes";

import { registry } from "./registry";

/**
 * Reusable component schemas registered under #/components/schemas.
 *
 * Every path that can return a validation or error response should reference
 * these via the errorResponses() helper below, to keep the OpenAPI document
 * consistent and avoid duplicating error shapes in every operation.
 */

/**
 * Registered as `ErrorCode` — the full list of machine-readable error codes
 * that the API returns in error responses. Consumers can use this enum to
 * programmatically handle specific failure modes (e.g., retry on 429, redirect
 * to login on TOKEN_EXPIRED).
 *
 * Mirrors `ErrorCode` in src/lib/shared/errors/error-codes.ts — keep in sync.
 */
export const ErrorCodeSchema = registry.register(
  "ErrorCode",
  z.enum(Object.values(ErrorCode) as [string, ...string[]]).openapi({
    description: "Machine-readable error code returned in every error response.",
    example: ErrorCode.VALIDATION_ERROR,
  })
);

/**
 * Registered as `FieldError` — represents a single field-level validation failure,
 * returned inside `ApiErrorBody.errors` for 400 VALIDATION_ERROR responses.
 */
export const FieldErrorSchema = registry.register(
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

/**
 * Registered as `ApiErrorBody` — the standard error response shape used by
 * every 4xx and 5xx response from the API. Produced by `ApiError` helpers
 * in src/lib/server/errors/api-error.ts.
 */
export const ApiErrorBodySchema = registry.register(
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

/**
 * Registered as `PaginationMeta` — envelope metadata used by paginated list
 * endpoints (e.g., GET /usuarios with ?page and ?limit).
 */
export const PaginationMetaSchema = registry.register(
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
 * Default descriptions for well-known HTTP status codes used in the API.
 * Kept short since each operation can override via its own description when needed.
 */
const STATUS_DESCRIPTIONS: Record<number, string> = {
  400: "Bad request — invalid input or validation failure",
  401: "Unauthorized — missing, invalid or expired token",
  403: "Forbidden — authenticated but lacking permission",
  404: "Not found — the requested resource does not exist",
  409: "Conflict — the request conflicts with current state",
  429: "Too many requests — rate limit exceeded",
  500: "Internal server error",
};

/**
 * Build a map of common error responses referencing the shared `ApiErrorBody`
 * schema. Usage in a path registration:
 *
 *   responses: {
 *     200: { description: "OK", content: {...} },
 *     ...errorResponses([400, 401, 404, 500]),
 *   }
 *
 * @param codes HTTP status codes to include (must be one of the keys in STATUS_DESCRIPTIONS).
 */
export function errorResponses(codes: number[]): Record<string, ResponseConfig> {
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
