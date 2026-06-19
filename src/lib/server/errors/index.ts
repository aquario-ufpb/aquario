// Re-export shared error types and codes
export { ErrorCode, isApiError, type ApiErrorBody, type FieldError } from "@/lib/shared/errors";

// Export server-specific utilities
export { ApiError, fromZodError, handleError } from "./api-error";
