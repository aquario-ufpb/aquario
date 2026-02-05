import { ErrorCode, isApiError, type ApiErrorBody, type FieldError } from "@/lib/shared/errors";

// Re-export shared types for convenience
export { ErrorCode, isApiError };
export type { ApiErrorBody, FieldError };

/**
 * Custom error class for API errors with code and field errors
 */
export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly errors?: FieldError[];
  public readonly status?: number;

  constructor(message: string, code: ErrorCode, errors?: FieldError[], status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.errors = errors;
    this.status = status;
  }

  /**
   * Check if this error has a specific code
   */
  hasCode(code: ErrorCode): boolean {
    return this.code === code;
  }

  /**
   * Get error message for a specific field
   */
  getFieldError(field: string): string | undefined {
    return this.errors?.find(e => e.field === field)?.message;
  }

  /**
   * Get all field errors as a record
   */
  getFieldErrors(): Record<string, string> {
    if (!this.errors) {
      return {};
    }
    return this.errors.reduce(
      (acc, err) => {
        acc[err.field] = err.message;
        return acc;
      },
      {} as Record<string, string>
    );
  }
}

/**
 * Parse an API error response into an ApiError instance
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  try {
    const data = await response.json();

    if (isApiError(data)) {
      return new ApiError(data.message, data.code, data.errors, response.status);
    }

    // Fallback for old format or unexpected response
    const message = data.message || data.error || "Erro desconhecido";
    return new ApiError(message, ErrorCode.INTERNAL_ERROR, undefined, response.status);
  } catch {
    // JSON parse failed
    return new ApiError("Erro de conexão", ErrorCode.INTERNAL_ERROR, undefined, response.status);
  }
}

/**
 * Helper to throw an ApiError from a failed response
 */
export async function throwApiError(response: Response): Promise<never> {
  throw await parseApiError(response);
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiErrorInstance(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Get user-friendly message from any error
 */
export function getErrorMessage(error: unknown, fallback = "Ocorreu um erro"): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
