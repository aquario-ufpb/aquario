/** @jest-environment node */
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@/lib/server/container", () => ({ getContainer: jest.fn() }));
jest.mock("@/lib/server/services/auth/middleware", () => ({ getOptionalUser: jest.fn() }));
import { createHash } from "node:crypto";
import { getContainer } from "@/lib/server/container";
import { getOptionalUser } from "@/lib/server/services/auth/middleware";
import { offeringRequestPolicy } from "../offering-request-policy";

const consumeRequest = jest.fn<Promise<boolean>, [string, number, number]>();
const request = (ip = "203.0.113.7") =>
  new Request("https://aquario.test/api/planejador/ofertas", {
    headers: { "x-forwarded-for": `${ip}, 10.0.0.1` },
  });
beforeEach(() => {
  jest.clearAllMocks();
  consumeRequest.mockReset().mockResolvedValue(true);
  jest
    .mocked(getContainer)
    .mockReturnValue({ publicOfferingCacheRepository: { consumeRequest } } as unknown as ReturnType<
      typeof getContainer
    >);
  jest.mocked(getOptionalUser).mockResolvedValue(null);
});
it("keeps anonymous reads public and persists only a hashed address with the shared budget", async () => {
  expect(await offeringRequestPolicy(request())).toEqual({ response: null, refresh: false });
  const hash = createHash("sha256").update("203.0.113.7").digest("hex");
  expect(consumeRequest).toHaveBeenCalledWith(`offering:${hash}`, 40, 60000);
  expect(consumeRequest.mock.calls.flat().join()).not.toContain("203.0.113.7");
  expect(getOptionalUser).not.toHaveBeenCalled();
});
it("downgrades anonymous refresh to a cached lookup instead of spending a refresh budget", async () => {
  expect(await offeringRequestPolicy(request(), true)).toEqual({ response: null, refresh: false });
  expect(getOptionalUser).toHaveBeenCalledTimes(1);
  expect(consumeRequest).toHaveBeenCalledTimes(1);
});
it("applies the three-refresh user budget across different client addresses", async () => {
  jest
    .mocked(getOptionalUser)
    .mockResolvedValue({ id: "owner" } as NonNullable<Awaited<ReturnType<typeof getOptionalUser>>>);
  let remaining = 3;
  consumeRequest.mockImplementation(key =>
    Promise.resolve(!key.startsWith("offering-refresh:") || remaining-- > 0)
  );
  const results = await Promise.all(
    Array.from({ length: 4 }, (_, i) => offeringRequestPolicy(request(`203.0.113.${i}`), true))
  );
  expect(results.filter(result => result.refresh)).toHaveLength(3);
  const rejected = results.find(result => result.response)?.response;
  expect(rejected?.status).toBe(429);
  expect(rejected?.headers.get("Retry-After")).toBe("60");
  expect(consumeRequest.mock.calls.filter(([key]) => key === "offering-refresh:owner")).toEqual(
    Array.from({ length: 4 }, () => ["offering-refresh:owner", 3, 60000])
  );
});
it("rejects an exhausted public budget before authenticating or contacting the refresh limiter", async () => {
  consumeRequest.mockResolvedValue(false);
  const result = await offeringRequestPolicy(request(), true);
  expect(result.refresh).toBe(false);
  expect(result.response?.status).toBe(429);
  expect(result.response?.headers.get("Retry-After")).toBe("60");
  expect(getOptionalUser).not.toHaveBeenCalled();
  expect(consumeRequest).toHaveBeenCalledTimes(1);
});
