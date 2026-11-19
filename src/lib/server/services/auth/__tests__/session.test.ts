/**
 * @jest-environment node
 */
import jwt from "jsonwebtoken";
import { POST as refresh } from "@/app/api/auth/refresh/route";
import { verifyToken, signToken } from "@/lib/server/services/jwt/jwt";
import { getOptionalUser, withAuth } from "../middleware";

const mockJwtSecret = "session-fixture-signing-secret-for-tests";
const mockFindById = jest.fn();
jest.mock("@/lib/server/container", () => ({
  getContainer: () => ({ usuariosRepository: { findById: mockFindById } }),
}));
jest.mock("@/lib/server/config/env", () => ({
  get JWT_SECRET() {
    return mockJwtSecret;
  },
  JWT_EXPIRES_IN: "7d",
}));

function request(token: string) {
  return new Request("http://localhost/api/auth/refresh", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

const userId = "session-fixture";
const start = Date.UTC(2026, 0, 1);
const day = 24 * 60 * 60 * 1000;

describe("session lifecycle", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(start);
    mockFindById.mockResolvedValue({ id: userId, sessionVersion: 0 });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("requires a new login for sessions issued before version tracking", async () => {
    const legacy = jwt.sign({ sub: userId }, mockJwtSecret, { expiresIn: "7d" });
    expect(verifyToken(legacy)).toBeNull();
    expect(await getOptionalUser(request(legacy))).toBeNull();
    expect((await withAuth(request(legacy), jest.fn())).status).toBe(401);
    expect((await refresh(request(legacy))).status).toBe(401);
  });

  it("revokes current and refreshed credentials for required, optional and refresh requests", async () => {
    const current = signToken(userId, 0);
    const response = await refresh(request(current));
    expect(response.status).toBe(200);
    const { token } = await response.json();
    expect(verifyToken(token)).toEqual({
      sub: userId,
      sessionVersion: 0,
      sessionStartedAt: start / 1000,
    });

    mockFindById.mockResolvedValue({ id: userId, sessionVersion: 1 });
    const handler = jest.fn();
    for (const stale of [current, token]) {
      expect(await getOptionalUser(request(stale))).toBeNull();
      expect((await withAuth(request(stale), handler)).status).toBe(401);
      expect((await refresh(request(stale))).status).toBe(401);
    }
    expect(handler).not.toHaveBeenCalled();
    expect((await getOptionalUser(request(signToken(userId, 1))))?.id).toBe(userId);
  });

  it("requires fresh login at the absolute deadline across repeated refreshes", async () => {
    let token = signToken(userId, 0);
    for (const elapsed of [6, 12, 18, 24, 29]) {
      jest.setSystemTime(start + elapsed * day);
      const result = await refresh(request(token));
      expect(result.status).toBe(200);
      token = (await result.json()).token;
      expect(verifyToken(token)?.sessionStartedAt).toBe(start / 1000);
    }
    jest.setSystemTime(start + 30 * day);
    expect(await getOptionalUser(request(token))).toBeNull();
    expect((await refresh(request(token))).status).toBe(401);
  });
});
