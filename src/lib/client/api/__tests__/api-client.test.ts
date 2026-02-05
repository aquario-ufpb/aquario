/* eslint-disable require-await */
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { apiClient } from "../api-client";

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe("apiClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("basic requests", () => {
    it("should make request to correct URL with API_URL prepended", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      await apiClient("/test-endpoint");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/test-endpoint"),
        expect.any(Object)
      );
    });

    it("should pass through fetch options", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      await apiClient("/test", {
        method: "POST",
        body: JSON.stringify({ data: "test" }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ data: "test" }),
        })
      );
    });
  });

  describe("token handling", () => {
    it("should add Authorization header when token provided in options", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      await apiClient("/test", { token: "my-token" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer my-token",
          }),
        })
      );
    });

    it("should not add Authorization header when token is null", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      await apiClient("/test", { token: null });

      const callArgs = mockFetch.mock.calls[0];
      const options = callArgs[1] as RequestInit;
      expect(options.headers).not.toHaveProperty("Authorization");
    });
  });

  describe("401 handling and token refresh", () => {
    it("should return 401 response when no token provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      const response = await apiClient("/test", { token: null });

      expect(response.status).toBe(401);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should attempt token refresh on 401 when token exists", async () => {
      // First call returns 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);
      // Refresh call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ token: "new-token" }),
      } as Response);
      // Retry succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const response = await apiClient("/test", { token: "old-token" });

      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should call onTokenRefresh callback after successful refresh", async () => {
      const onTokenRefresh = jest.fn();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ token: "refreshed-token" }),
      } as Response);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      await apiClient("/test", { token: "old-token", onTokenRefresh });

      expect(onTokenRefresh).toHaveBeenCalledWith("refreshed-token");
    });

    it("should return original 401 response when refresh fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Refresh failed" }),
      } as Response);

      const response = await apiClient("/test", { token: "old-token" });

      expect(response.status).toBe(401);
    });

    it("should retry with new token after successful refresh", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ token: "new-token" }),
      } as Response);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      await apiClient("/test", { token: "old-token" });

      // Third call should have new token
      const thirdCall = mockFetch.mock.calls[2];
      const options = thirdCall[1] as RequestInit;
      expect((options.headers as Record<string, string>).Authorization).toBe("Bearer new-token");
    });
  });

  describe("non-401 errors", () => {
    it("should pass through non-401 error responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const response = await apiClient("/test", { token: "my-token" });

      expect(response.status).toBe(500);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should pass through 403 responses without refresh", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      } as Response);

      const response = await apiClient("/test", { token: "my-token" });

      expect(response.status).toBe(403);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("header merging", () => {
    it("should merge custom headers with Authorization", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      await apiClient("/test", {
        token: "my-token",
        headers: {
          "Content-Type": "application/json",
          "X-Custom": "value",
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-Custom": "value",
            Authorization: "Bearer my-token",
          }),
        })
      );
    });
  });
});
