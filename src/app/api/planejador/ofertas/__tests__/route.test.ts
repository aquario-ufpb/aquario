/** @jest-environment node */
import { NextResponse } from "next/server";
import { GET } from "../route";
import { POST as batchPost } from "../abrangentes/route";
import { POST as cachePost } from "../cache/route";
import { offeringRequestPolicy } from "@/lib/server/services/planner/offering-request-policy";
import {
  getPublicSigaaCourses,
  getCachedPublicSigaaOfferings,
} from "@/lib/server/services/planner/sigaa-offerings";
import {
  getLimitedPublicSigaaOfferings,
  getOfferingBatch,
  OfferingQueueFullError,
} from "@/lib/server/services/planner/offerings-batch";

jest.mock("@/lib/server/services/planner/offering-request-policy", () => ({
  offeringRequestPolicy: jest.fn(),
}));
jest.mock("@/lib/server/services/planner/sigaa-offerings", () => ({
  getPublicSigaaCourses: jest.fn(),
  getCachedPublicSigaaOfferings: jest.fn(),
}));
jest.mock("@/lib/server/services/planner/offerings-batch", () => ({
  getLimitedPublicSigaaOfferings: jest.fn(),
  getOfferingBatch: jest.fn(),
  OfferingQueueFullError: class OfferingQueueFullError extends Error {},
}));

const body = { semester: "2026.2", courseIds: ["1626669"], codes: ["DINF00078"] };
const post = (value: unknown) =>
  new Request("http://localhost/api/planejador/ofertas", {
    method: "POST",
    body: JSON.stringify(value),
  });
const get = (query = "?curso=1626669&semestre=2026.2") =>
  new Request(`http://localhost/api/planejador/ofertas${query}`);

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(offeringRequestPolicy).mockResolvedValue({ response: null, refresh: false });
  jest.mocked(getPublicSigaaCourses).mockResolvedValue([]);
  jest.mocked(getCachedPublicSigaaOfferings).mockResolvedValue([]);
  jest.mocked(getOfferingBatch).mockResolvedValue({ results: [], failedCourseIds: [] });
});

it("lists courses through the request policy without loading offerings", async () => {
  expect(await (await GET(get(""))).json()).toEqual({ courses: [] });
  expect(offeringRequestPolicy).toHaveBeenCalled();
  expect(getLimitedPublicSigaaOfferings).not.toHaveBeenCalled();
});

it.each([false, true])("uses the policy's approved refresh=%s for GET", async refresh => {
  jest.mocked(offeringRequestPolicy).mockResolvedValue({ response: null, refresh });
  const request = get("?curso=1626669&semestre=2026.2&atualizar=1");
  await GET(request);
  expect(offeringRequestPolicy).toHaveBeenCalledWith(request, true);
  expect(getLimitedPublicSigaaOfferings).toHaveBeenCalledWith("1626669", "2026.2", refresh);
});

it.each([false, true])("uses the policy's approved refresh=%s for batch POST", async refresh => {
  jest.mocked(offeringRequestPolicy).mockResolvedValue({ response: null, refresh });
  const request = post({ ...body, refresh: true });
  expect((await batchPost(request)).status).toBe(200);
  expect(offeringRequestPolicy).toHaveBeenCalledWith(request, true);
  expect(getOfferingBatch).toHaveBeenCalledWith({ ...body, refresh });
});

it.each([
  ["GET", (request: Request) => GET(request), () => get()],
  ["batch", batchPost, () => post(body)],
  ["cache", cachePost, () => post(body)],
] as const)(
  "returns the policy's rate limit without reading data for %s",
  async (_name, handler, request) => {
    const denied = NextResponse.json(
      { message: "rate limited" },
      {
        status: 429,
        headers: { "Retry-After": "60" },
      }
    );
    jest.mocked(offeringRequestPolicy).mockResolvedValue({ response: denied, refresh: false });
    const response = await handler(request());
    expect(response).toBe(denied);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(getPublicSigaaCourses).not.toHaveBeenCalled();
    expect(getLimitedPublicSigaaOfferings).not.toHaveBeenCalled();
    expect(getOfferingBatch).not.toHaveBeenCalled();
    expect(getCachedPublicSigaaOfferings).not.toHaveBeenCalled();
  }
);

it("returns 429 and retry guidance when the offering queue is full", async () => {
  jest.mocked(getLimitedPublicSigaaOfferings).mockRejectedValue(new OfferingQueueFullError());
  const response = await GET(get());
  expect(response.status).toBe(429);
  expect(response.headers.get("Retry-After")).toBe("30");
});

it("returns 502 for an actual upstream offering failure", async () => {
  jest.mocked(getLimitedPublicSigaaOfferings).mockRejectedValue(new Error("upstream"));
  expect((await GET(get())).status).toBe(502);
});

it.each([
  ["batch", batchPost],
  ["cache", cachePost],
] as const)("rejects malformed JSON with 400 for %s", async (_name, handler) => {
  const response = await handler(new Request("http://localhost", { method: "POST", body: "{" }));
  expect(response.status).toBe(400);
  expect(offeringRequestPolicy).not.toHaveBeenCalled();
  expect(getOfferingBatch).not.toHaveBeenCalled();
  expect(getCachedPublicSigaaOfferings).not.toHaveBeenCalled();
});

it.each([
  ["batch", batchPost],
  ["cache", cachePost],
] as const)("rejects invalid schema with 400 for %s", async (_name, handler) => {
  expect((await handler(post({ ...body, semester: "invalid" }))).status).toBe(400);
  expect(offeringRequestPolicy).not.toHaveBeenCalled();
});

it.each([
  ["batch", batchPost],
  ["cache", cachePost],
] as const)("keeps service failures as 502 for %s", async (_name, handler) => {
  jest.mocked(getOfferingBatch).mockRejectedValue(new Error("upstream"));
  jest.mocked(getCachedPublicSigaaOfferings).mockRejectedValue(new Error("database"));
  expect((await handler(post(body))).status).toBe(502);
});

it("reads cache after the policy and reports missing courses without upstream calls", async () => {
  const response = await cachePost(post(body));
  expect(await response.json()).toEqual({ results: [], missingCourseIds: ["1626669"] });
  expect(getCachedPublicSigaaOfferings).toHaveBeenCalledWith("2026.2", ["1626669"]);
  expect(offeringRequestPolicy).toHaveBeenCalled();
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(getLimitedPublicSigaaOfferings).not.toHaveBeenCalled();
});
