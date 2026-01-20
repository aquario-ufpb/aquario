import { signToken, verifyToken, decodeToken } from "../jwt";
import jwt from "jsonwebtoken";

// Mock the env config
jest.mock("@/lib/server/config/env", () => ({
  JWT_SECRET: "test-secret-key-for-testing",
  JWT_EXPIRES_IN: "7d",
}));

describe("JWT Service", () => {
  const testUserId = "user-123";
  const testSecret = "test-secret-key-for-testing";

  describe("signToken", () => {
    it("should create a valid JWT token for a user", () => {
      const token = signToken(testUserId);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should include user ID in the token payload", () => {
      const token = signToken(testUserId);
      const decoded = jwt.verify(token, testSecret) as any;

      expect(decoded.sub).toBe(testUserId);
    });

    it("should set expiration time on the token", () => {
      const token = signToken(testUserId);
      const decoded = jwt.verify(token, testSecret) as any;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it("should create different tokens for different users", () => {
      const token1 = signToken("user-1");
      const token2 = signToken("user-2");

      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyToken", () => {
    it("should verify and decode a valid token", () => {
      const token = signToken(testUserId);
      const payload = verifyToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe(testUserId);
    });

    it("should return null for an invalid token", () => {
      const invalidToken = "invalid.token.here";
      const payload = verifyToken(invalidToken);

      expect(payload).toBeNull();
    });

    it("should return null for a malformed token", () => {
      const malformedToken = "not-a-jwt";
      const payload = verifyToken(malformedToken);

      expect(payload).toBeNull();
    });

    it("should return null for an expired token", () => {
      // Create a token that expires immediately
      const expiredToken = jwt.sign(
        { sub: testUserId },
        testSecret,
        { expiresIn: "0s" }
      );

      // Wait a bit to ensure expiration
      const payload = verifyToken(expiredToken);

      expect(payload).toBeNull();
    });

    it("should return null for a token with wrong signature", () => {
      const tokenWithWrongSignature = jwt.sign(
        { sub: testUserId },
        "wrong-secret"
      );

      const payload = verifyToken(tokenWithWrongSignature);

      expect(payload).toBeNull();
    });

    it("should extract all payload fields", () => {
      const token = signToken(testUserId);
      const payload = verifyToken(token);

      expect(payload).toHaveProperty("sub");
      expect(payload).toHaveProperty("iat");
      expect(payload).toHaveProperty("exp");
    });
  });

  describe("decodeToken", () => {
    it("should decode a valid token without verification", () => {
      const token = signToken(testUserId);
      const payload = decodeToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe(testUserId);
    });

    it("should decode a token even with wrong signature", () => {
      const tokenWithWrongSignature = jwt.sign(
        { sub: testUserId },
        "wrong-secret"
      );

      const payload = decodeToken(tokenWithWrongSignature);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe(testUserId);
    });

    it("should return null for a malformed token", () => {
      const malformedToken = "not-a-jwt";
      const payload = decodeToken(malformedToken);

      expect(payload).toBeNull();
    });

    it("should decode an expired token", () => {
      const expiredToken = jwt.sign(
        { sub: testUserId },
        testSecret,
        { expiresIn: "0s" }
      );

      const payload = decodeToken(expiredToken);

      // decodeToken should still work for expired tokens
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe(testUserId);
    });

    it("should extract payload without validation", () => {
      const customPayload = {
        sub: "custom-user",
        custom: "data",
      };
      const token = jwt.sign(customPayload, testSecret);
      const payload = decodeToken(token) as any;

      expect(payload.sub).toBe("custom-user");
      expect(payload.custom).toBe("data");
    });
  });
});
