import type { ErrorCode } from "./error-codes";

/**
 * Field-level validation error
 */
export type FieldError = {
  field: string;
  message: string;
};

/**
 * Standard API error response body
 */
export type ApiErrorBody = {
  message: string;
  code: ErrorCode;
  errors?: FieldError[];
};

/**
 * Type guard to check if a value is an API error response
 */
export function isApiError(value: unknown): value is ApiErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    "code" in value &&
    typeof (value as ApiErrorBody).message === "string" &&
    typeof (value as ApiErrorBody).code === "string"
  );
}
