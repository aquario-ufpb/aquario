// Re-export shared error types and codes
export { ErrorCode, isApiError, type ApiErrorBody, type FieldError } from "@/lib/shared/errors";

// Export server-specific utilities
export { ApiError, errorResponse, fromZodError, handleError } from "./api-error";
