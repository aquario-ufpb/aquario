/**
 * @jest-environment node
 *
 * The route handler and its transitive imports (via the OpenAPI generator)
 * pull in Next.js runtime modules that need Node's global Request/Response.
 */
import { describe, it, expect, beforeEach } from "@jest/globals";

import { __resetOpenApiCacheForTests } from "@/lib/server/openapi/generator";

import { GET, OPTIONS } from "../route";

describe("GET /api/openapi", () => {
  beforeEach(() => {
    __resetOpenApiCacheForTests();
  });

  it("responds with status 200", () => {
    const response = GET();
    expect(response.status).toBe(200);
  });

  it("responds with content-type application/json", () => {
    const response = GET();
    expect(response.headers.get("content-type")).toMatch(/application\/json/);
  });

  it("sets CORS headers so external tools can import the spec", () => {
    const response = GET();
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toContain("GET");
  });

  it("returns a body that parses as an OpenAPI 3.1 document", async () => {
    const response = GET();
    const body = (await response.json()) as Record<string, unknown>;

    expect(body.openapi).toBe("3.1.0");
    expect(body.info).toBeDefined();
    expect(body.paths).toBeDefined();
    expect(Object.keys(body.paths as Record<string, unknown>).length).toBeGreaterThan(0);
  });

  it("returns a deterministic OpenAPI payload across multiple requests", async () => {
    const first = (await GET().json()) as Record<string, unknown>;
    const second = (await GET().json()) as Record<string, unknown>;

    expect(second).toEqual(first);
  });
});

describe("OPTIONS /api/openapi (CORS preflight)", () => {
  it("responds with status 204", () => {
    const response = OPTIONS();
    expect(response.status).toBe(204);
  });

  it("sets the preflight CORS headers", () => {
    const response = OPTIONS();
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toContain("GET");
    expect(response.headers.get("access-control-max-age")).toBeTruthy();
  });

  it("returns an empty body", async () => {
    const response = OPTIONS();
    const text = await response.text();
    expect(text).toBe("");
  });
});
