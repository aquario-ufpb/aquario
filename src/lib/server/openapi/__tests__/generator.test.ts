/**
 * @jest-environment node
 *
 * This suite imports the OpenAPI generator, which in turn pulls in Next.js
 * route handlers via the paths registry. `next/server` relies on the global
 * `Request` and `Response` objects, which are present in Node 18+ but not in
 * jsdom. Forcing the `node` environment here keeps the import chain working.
 */
import { describe, it, expect, beforeEach } from "@jest/globals";

import packageJson from "../../../../../package.json";
import { __resetOpenApiCacheForTests, getOpenApiDocument } from "../generator";

describe("getOpenApiDocument", () => {
  beforeEach(() => {
    __resetOpenApiCacheForTests();
  });

  it("returns a document with the required OpenAPI 3.1 top-level fields", () => {
    const doc = getOpenApiDocument();

    expect(doc.openapi).toBe("3.1.0");
    expect(doc.info).toBeDefined();
    expect(doc.info.title).toBeTruthy();
    expect(doc.info.version).toBeTruthy();
    expect(doc.paths).toBeDefined();
    expect(doc.components).toBeDefined();
  });

  it("uses the current package.json version in info.version", () => {
    const doc = getOpenApiDocument();
    expect(doc.info.version).toBe(packageJson.version);
  });

  it("declares at least the production and localhost servers", () => {
    const doc = getOpenApiDocument();
    const serverUrls = (doc.servers ?? []).map(s => s.url);

    expect(serverUrls).toContain("https://www.aquarioufpb.com");
    expect(serverUrls).toContain("http://localhost:3000");
  });

  it("registers the bearerAuth security scheme", () => {
    const doc = getOpenApiDocument();
    const schemes = doc.components?.securitySchemes ?? {};

    expect(schemes).toHaveProperty("bearerAuth");
    // openapi3-ts types for security schemes are a union; we assert the shape
    // we actually registered in registry.ts.
    expect(schemes.bearerAuth).toMatchObject({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });
  });

  it("registers every expected resource tag in info.tags", () => {
    const doc = getOpenApiDocument();
    const tagNames = (doc.tags ?? []).map(t => t.name);

    const expectedTags = [
      "Auth",
      "Users",
      "Entities",
      "Vagas",
      "Guides",
      "Courses",
      "Academic Centers",
      "Campus",
      "Disciplines",
      "Curricula",
      "Academic Calendar",
      "Search",
      "Health",
      "Upload",
      "Content Images",
    ];

    for (const expected of expectedTags) {
      expect(tagNames).toContain(expected);
    }
  });

  it("registers exactly the expected number of paths (no /dev/* leakage)", () => {
    const doc = getOpenApiDocument();
    const paths = Object.keys(doc.paths ?? {});

    // The aquario has 59 total route.ts files under src/app/api/,
    // of which 3 live under /dev and must NEVER appear in the public spec.
    // This leaves 56 documented paths.
    expect(paths.length).toBe(56);
  });

  it("does not leak any /dev/* endpoints into the public spec", () => {
    const doc = getOpenApiDocument();
    const devPaths = Object.keys(doc.paths ?? {}).filter(p => p.startsWith("/dev"));

    // Dev endpoints (/api/dev/promote-admin, /api/dev/toggle-entidade-admin,
    // /api/dev/clear-onboarding) only run when IS_DEV is true and return 404
    // in production. Exposing them in the public OpenAPI would mislead clients
    // into believing they can call routes that always 404 in prod.
    expect(devPaths).toEqual([]);
  });

  it("every operation has at least one 2xx response", () => {
    const doc = getOpenApiDocument();

    for (const [pathKey, pathItem] of Object.entries(doc.paths ?? {})) {
      const methods = ["get", "post", "put", "patch", "delete"] as const;
      for (const method of methods) {
        const operation = pathItem[method];
        if (!operation) {
          continue;
        }
        const statusCodes = Object.keys(operation.responses ?? {});
        const has2xx = statusCodes.some(code => /^2\d\d$/.test(code));
        expect(has2xx).toBe(true);
        if (!has2xx) {
          throw new Error(`Operation ${method.toUpperCase()} ${pathKey} has no 2xx response`);
        }
      }
    }
  });

  it("every bearerAuth-protected operation references the security scheme", () => {
    const doc = getOpenApiDocument();

    // Walk every operation and find the ones that declare `security`
    const securedOperations: Array<{ path: string; method: string; security: unknown }> = [];
    for (const [pathKey, pathItem] of Object.entries(doc.paths ?? {})) {
      const methods = ["get", "post", "put", "patch", "delete"] as const;
      for (const method of methods) {
        const operation = pathItem[method];
        if (operation?.security && operation.security.length > 0) {
          securedOperations.push({ path: pathKey, method, security: operation.security });
        }
      }
    }

    // Auth has ~3 secured (me, refresh, reenviar-verificacao), usuarios many, etc.
    // We don't assert an exact count (would drift), but we do assert:
    //   1. At least some operations are marked as secured
    //   2. Every one that is, uses bearerAuth
    expect(securedOperations.length).toBeGreaterThan(10);
    for (const op of securedOperations) {
      // Shape is: security: [{ bearerAuth: [] }]
      expect(Array.isArray(op.security)).toBe(true);
      const securityArray = op.security as Array<Record<string, unknown>>;
      expect(securityArray[0]).toHaveProperty("bearerAuth");
    }
  });

  it("caches the generated document across calls (lazy singleton)", () => {
    const first = getOpenApiDocument();
    const second = getOpenApiDocument();

    // Strict identity: same object reference, not just deep-equal.
    // This is what validates the lazy singleton cache behavior.
    expect(second).toBe(first);
  });

  it("re-generates the document after __resetOpenApiCacheForTests is called", () => {
    const first = getOpenApiDocument();
    __resetOpenApiCacheForTests();
    const second = getOpenApiDocument();

    // After reset, identity should differ but structure should match.
    expect(second).not.toBe(first);
    expect(second.openapi).toBe(first.openapi);
    expect(Object.keys(second.paths ?? {}).length).toBe(Object.keys(first.paths ?? {}).length);
  });

  it("includes the canonical ApiErrorBody component schema", () => {
    const doc = getOpenApiDocument();
    const schemas = doc.components?.schemas ?? {};

    expect(schemas).toHaveProperty("ApiErrorBody");
    expect(schemas).toHaveProperty("ErrorCode");
    expect(schemas).toHaveProperty("FieldError");
    expect(schemas).toHaveProperty("PaginationMeta");
  });
});
