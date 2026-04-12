/**
 * @jest-environment node
 *
 * See the note in generator.test.ts — importing the generator pulls in
 * Next.js route handlers that require the Node `Request`/`Response` globals.
 */
import { describe, it, expect, beforeEach } from "@jest/globals";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { ErrorCode } from "@/lib/shared/errors/error-codes";

import { registerCommonSchemas, type CommonSchemas } from "../common-schemas";
import { __resetOpenApiCacheForTests, getOpenApiDocument } from "../generator";

describe("common-schemas", () => {
  beforeEach(() => {
    __resetOpenApiCacheForTests();
  });

  describe("registered component schemas (via full document generation)", () => {
    it("registers ApiErrorBody in components/schemas", () => {
      const doc = getOpenApiDocument();
      const schemas = doc.components?.schemas ?? {};

      expect(schemas.ApiErrorBody).toBeDefined();
    });

    it("registers the ErrorCode enum with all ErrorCode values", () => {
      const doc = getOpenApiDocument();
      const errorCodeSchema = doc.components?.schemas?.ErrorCode as { enum?: string[] } | undefined;

      expect(errorCodeSchema).toBeDefined();
      expect(errorCodeSchema?.enum).toBeDefined();

      // Every value in the ErrorCode const object must appear in the spec enum.
      // This is the test that catches drift when somebody adds a new error code
      // to src/lib/shared/errors/error-codes.ts without thinking about docs.
      const expectedValues = Object.values(ErrorCode);
      for (const value of expectedValues) {
        expect(errorCodeSchema?.enum).toContain(value);
      }
    });

    it("registers FieldError and PaginationMeta", () => {
      const doc = getOpenApiDocument();
      const schemas = doc.components?.schemas ?? {};

      expect(schemas.FieldError).toBeDefined();
      expect(schemas.PaginationMeta).toBeDefined();
    });
  });

  describe("registerCommonSchemas() in isolation", () => {
    let registry: OpenAPIRegistry;
    let schemas: CommonSchemas;

    beforeEach(() => {
      // Each test gets a fresh registry + schemas, mirroring how
      // getOpenApiDocument() builds them.
      registry = new OpenAPIRegistry();
      schemas = registerCommonSchemas(registry);
    });

    it("returns all four common component schemas", () => {
      expect(schemas.ErrorCodeSchema).toBeDefined();
      expect(schemas.FieldErrorSchema).toBeDefined();
      expect(schemas.ApiErrorBodySchema).toBeDefined();
      expect(schemas.PaginationMetaSchema).toBeDefined();
    });

    it("accepts a valid error body through ApiErrorBodySchema", () => {
      const parsed = schemas.ApiErrorBodySchema.safeParse({
        message: "Email inválido",
        code: ErrorCode.VALIDATION_ERROR,
      });
      expect(parsed.success).toBe(true);
    });

    it("accepts a validation error with field-level errors", () => {
      const parsed = schemas.ApiErrorBodySchema.safeParse({
        message: "Dados inválidos",
        code: ErrorCode.VALIDATION_ERROR,
        errors: [{ field: "email", message: "Email inválido" }],
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects a body missing the required code field", () => {
      const parsed = schemas.ApiErrorBodySchema.safeParse({ message: "Erro" });
      expect(parsed.success).toBe(false);
    });

    it("does NOT share Zod schema instances between successive registry calls", () => {
      // Building a second registry should return fresh schema references,
      // not the same objects as the first call. This is what guarantees
      // getOpenApiDocument() is a pure function of the code — no cross-call
      // state leaks through shared Zod schemas.
      const secondRegistry = new OpenAPIRegistry();
      const secondSchemas = registerCommonSchemas(secondRegistry);

      expect(secondSchemas.ApiErrorBodySchema).not.toBe(schemas.ApiErrorBodySchema);
      expect(secondSchemas.ErrorCodeSchema).not.toBe(schemas.ErrorCodeSchema);
      expect(secondSchemas.FieldErrorSchema).not.toBe(schemas.FieldErrorSchema);
      expect(secondSchemas.PaginationMetaSchema).not.toBe(schemas.PaginationMetaSchema);
    });
  });

  describe("errorResponses() helper", () => {
    let errorResponses: CommonSchemas["errorResponses"];

    beforeEach(() => {
      const registry = new OpenAPIRegistry();
      errorResponses = registerCommonSchemas(registry).errorResponses;
    });

    it("returns a map with one entry per provided status code", () => {
      const responses = errorResponses([400, 401, 404, 500]);

      expect(Object.keys(responses)).toEqual(["400", "401", "404", "500"]);
    });

    it("each entry references ApiErrorBody via application/json", () => {
      const responses = errorResponses([400, 401, 500]);

      for (const code of ["400", "401", "500"]) {
        const entry = responses[code];
        expect(entry).toBeDefined();
        expect(entry.description).toBeTruthy();
        expect(entry.content).toBeDefined();
        expect(entry.content?.["application/json"]).toBeDefined();
      }
    });

    it("provides distinct human descriptions for each status code", () => {
      const responses = errorResponses([400, 401, 403, 404, 409, 429, 500]);
      const descriptions = Object.values(responses).map(r => r.description);
      const unique = new Set(descriptions);

      // Every known status code has its own description line in STATUS_DESCRIPTIONS.
      expect(unique.size).toBe(descriptions.length);
    });

    it("throws on unknown status codes to force contributors to add them explicitly", () => {
      expect(() => errorResponses([418])).toThrow(/unknown status code 418/);
    });
  });
});
