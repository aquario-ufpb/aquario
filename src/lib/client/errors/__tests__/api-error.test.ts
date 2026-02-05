/* eslint-disable require-await */
import { describe, it, expect } from "@jest/globals";
import {
  ApiError,
  parseApiError,
  throwApiError,
  isApiErrorInstance,
  getErrorMessage,
  ErrorCode,
} from "../api-error";

describe("ApiError", () => {
  describe("constructor", () => {
    it("should create an error with message and code", () => {
      const error = new ApiError("Test error", ErrorCode.VALIDATION_ERROR);

      expect(error.message).toBe("Test error");
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.name).toBe("ApiError");
      expect(error.errors).toBeUndefined();
      expect(error.status).toBeUndefined();
    });

    it("should create an error with field errors", () => {
      const fieldErrors = [
        { field: "email", message: "Email is required" },
        { field: "password", message: "Password too short" },
      ];
      const error = new ApiError("Validation failed", ErrorCode.VALIDATION_ERROR, fieldErrors);

      expect(error.errors).toEqual(fieldErrors);
    });

    it("should create an error with status code", () => {
      const error = new ApiError("Not found", ErrorCode.USER_NOT_FOUND, undefined, 404);

      expect(error.status).toBe(404);
    });
  });

  describe("hasCode", () => {
    it("should return true when codes match", () => {
      const error = new ApiError("Test", ErrorCode.VALIDATION_ERROR);

      expect(error.hasCode(ErrorCode.VALIDATION_ERROR)).toBe(true);
    });

    it("should return false when codes do not match", () => {
      const error = new ApiError("Test", ErrorCode.VALIDATION_ERROR);

      expect(error.hasCode(ErrorCode.INTERNAL_ERROR)).toBe(false);
    });
  });

  describe("getFieldError", () => {
    it("should return error message for existing field", () => {
      const error = new ApiError("Validation failed", ErrorCode.VALIDATION_ERROR, [
        { field: "email", message: "Invalid email format" },
        { field: "password", message: "Password required" },
      ]);

      expect(error.getFieldError("email")).toBe("Invalid email format");
      expect(error.getFieldError("password")).toBe("Password required");
    });

    it("should return undefined for non-existing field", () => {
      const error = new ApiError("Validation failed", ErrorCode.VALIDATION_ERROR, [
        { field: "email", message: "Invalid email" },
      ]);

      expect(error.getFieldError("username")).toBeUndefined();
    });

    it("should return undefined when no field errors exist", () => {
      const error = new ApiError("Error", ErrorCode.INTERNAL_ERROR);

      expect(error.getFieldError("email")).toBeUndefined();
    });
  });

  describe("getFieldErrors", () => {
    it("should return empty object when no errors", () => {
      const error = new ApiError("Error", ErrorCode.INTERNAL_ERROR);

      expect(error.getFieldErrors()).toEqual({});
    });

    it("should return all field errors as record", () => {
      const error = new ApiError("Validation failed", ErrorCode.VALIDATION_ERROR, [
        { field: "email", message: "Invalid email" },
        { field: "password", message: "Too short" },
      ]);

      expect(error.getFieldErrors()).toEqual({
        email: "Invalid email",
        password: "Too short",
      });
    });
  });
});

describe("parseApiError", () => {
  it("should parse valid API error response", async () => {
    const response = {
      status: 400,
      json: async () => ({
        message: "Validation error",
        code: ErrorCode.VALIDATION_ERROR,
        errors: [{ field: "email", message: "Invalid" }],
      }),
    } as Response;

    const error = await parseApiError(response);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe("Validation error");
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.status).toBe(400);
    expect(error.errors).toEqual([{ field: "email", message: "Invalid" }]);
  });

  it("should handle old format with message only", async () => {
    const response = {
      status: 500,
      json: async () => ({
        message: "Something went wrong",
      }),
    } as Response;

    const error = await parseApiError(response);

    expect(error.message).toBe("Something went wrong");
    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
  });

  it("should handle old format with error field", async () => {
    const response = {
      status: 500,
      json: async () => ({
        error: "Legacy error message",
      }),
    } as Response;

    const error = await parseApiError(response);

    expect(error.message).toBe("Legacy error message");
    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
  });

  it("should handle unknown response format", async () => {
    const response = {
      status: 500,
      json: async () => ({
        foo: "bar",
      }),
    } as Response;

    const error = await parseApiError(response);

    expect(error.message).toBe("Erro desconhecido");
    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
  });

  it("should handle JSON parse failure", async () => {
    const response = {
      status: 500,
      json: async (): Promise<unknown> => {
        throw new Error("Invalid JSON");
      },
    } as Response;

    const error = await parseApiError(response);

    expect(error.message).toBe("Erro de conexão");
    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.status).toBe(500);
  });
});

describe("throwApiError", () => {
  it("should throw ApiError parsed from response", async () => {
    const response = {
      status: 404,
      json: async () => ({
        message: "User not found",
        code: ErrorCode.USER_NOT_FOUND,
      }),
    } as Response;

    await expect(throwApiError(response)).rejects.toThrow(ApiError);
    await expect(throwApiError(response)).rejects.toThrow("User not found");
  });
});

describe("isApiErrorInstance", () => {
  it("should return true for ApiError instance", () => {
    const error = new ApiError("Test", ErrorCode.INTERNAL_ERROR);

    expect(isApiErrorInstance(error)).toBe(true);
  });

  it("should return false for regular Error", () => {
    const error = new Error("Test");

    expect(isApiErrorInstance(error)).toBe(false);
  });

  it("should return false for non-error objects", () => {
    expect(isApiErrorInstance({ message: "Test" })).toBe(false);
    expect(isApiErrorInstance(null)).toBe(false);
    expect(isApiErrorInstance(undefined)).toBe(false);
    expect(isApiErrorInstance("error")).toBe(false);
  });
});

describe("getErrorMessage", () => {
  it("should return message from ApiError", () => {
    const error = new ApiError("API error message", ErrorCode.INTERNAL_ERROR);

    expect(getErrorMessage(error)).toBe("API error message");
  });

  it("should return message from regular Error", () => {
    const error = new Error("Regular error message");

    expect(getErrorMessage(error)).toBe("Regular error message");
  });

  it("should return default fallback for unknown errors", () => {
    expect(getErrorMessage("string error")).toBe("Ocorreu um erro");
    expect(getErrorMessage({ foo: "bar" })).toBe("Ocorreu um erro");
    expect(getErrorMessage(null)).toBe("Ocorreu um erro");
  });

  it("should return custom fallback when provided", () => {
    expect(getErrorMessage(null, "Custom fallback")).toBe("Custom fallback");
  });
});
