import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ErrorCode, type ApiErrorBody, type FieldError } from "@/lib/shared/errors";

// Re-export shared types for convenience
export type { ApiErrorBody, FieldError };

/**
 * Create a standardized error response
 */
export function errorResponse(
  message: string,
  code: ErrorCode,
  status: number,
  errors?: FieldError[]
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = { message, code };
  if (errors && errors.length > 0) {
    body.errors = errors;
  }
  return NextResponse.json(body, { status });
}

/**
 * Common error responses
 */
export const ApiError = {
  // 400 Bad Request
  badRequest: (message: string, code: ErrorCode = ErrorCode.INVALID_INPUT) =>
    errorResponse(message, code, 400),

  validation: (message: string, errors?: FieldError[]) =>
    errorResponse(message, ErrorCode.VALIDATION_ERROR, 400, errors),

  // 401 Unauthorized
  unauthorized: (message = "Não autorizado", code: ErrorCode = ErrorCode.UNAUTHORIZED) =>
    errorResponse(message, code, 401),

  tokenMissing: () => errorResponse("Token não fornecido", ErrorCode.TOKEN_MISSING, 401),

  tokenInvalid: () => errorResponse("Token inválido ou expirado", ErrorCode.TOKEN_INVALID, 401),

  invalidCredentials: () =>
    errorResponse("Email ou senha incorretos", ErrorCode.INVALID_CREDENTIALS, 401),

  // 403 Forbidden
  forbidden: (message = "Acesso negado") => errorResponse(message, ErrorCode.FORBIDDEN, 403),

  // 404 Not Found
  notFound: (resource = "Recurso", code: ErrorCode = ErrorCode.NOT_FOUND) =>
    errorResponse(`${resource} não encontrado`, code, 404),

  userNotFound: () => errorResponse("Usuário não encontrado", ErrorCode.USER_NOT_FOUND, 404),

  entidadeNotFound: () =>
    errorResponse("Entidade não encontrada", ErrorCode.ENTIDADE_NOT_FOUND, 404),

  membroNotFound: () => errorResponse("Membresia não encontrada", ErrorCode.MEMBRO_NOT_FOUND, 404),

  cargoNotFound: () => errorResponse("Cargo não encontrado", ErrorCode.CARGO_NOT_FOUND, 404),

  // 409 Conflict
  conflict: (message: string, code: ErrorCode = ErrorCode.CONFLICT) =>
    errorResponse(message, code, 409),

  emailExists: () =>
    errorResponse("Este email já está cadastrado", ErrorCode.EMAIL_ALREADY_EXISTS, 409),

  slugExists: () =>
    errorResponse("Este slug já está sendo usado", ErrorCode.SLUG_ALREADY_EXISTS, 409),

  alreadyMember: () =>
    errorResponse("Este usuário já é membro ativo desta entidade", ErrorCode.ALREADY_MEMBER, 409),

  // 429 Too Many Requests
  rateLimited: (message = "Muitas tentativas. Tente novamente mais tarde.") =>
    errorResponse(message, ErrorCode.RATE_LIMITED, 429),

  // 500 Internal Server Error
  internal: (message = "Erro interno do servidor") =>
    errorResponse(message, ErrorCode.INTERNAL_ERROR, 500),
};

/**
 * Convert Zod validation errors to our standard format
 */
export function fromZodError(error: ZodError): NextResponse<ApiErrorBody> {
  const fieldErrors: FieldError[] = error.errors.map(err => ({
    field: err.path.join("."),
    message: err.message,
  }));

  const firstMessage = error.errors[0]?.message || "Dados inválidos";

  return ApiError.validation(firstMessage, fieldErrors);
}

/**
 * Handle unknown errors safely
 */
export function handleError(error: unknown, fallbackMessage = "Erro interno"): NextResponse {
  if (error instanceof ZodError) {
    return fromZodError(error);
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  return ApiError.internal(message);
}
