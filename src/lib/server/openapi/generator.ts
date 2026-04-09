import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import type { OpenAPIObject } from "openapi3-ts/oas31";

import packageJson from "../../../../package.json";

import { registerCommonSchemas } from "./common-schemas";
import { createRegistry, OPENAPI_TAGS } from "./registry";
import { registerAllPaths } from "./paths";

/**
 * Module-level cache for the generated document. Filled on first call and
 * reused for every subsequent request during the lifetime of the process.
 *
 * In development Next.js reloads modules when source files change, which
 * naturally invalidates this cache so contributors see fresh docs without
 * any extra plumbing. In production the cache persists for the lifetime of
 * the serverless function instance.
 *
 * Note that ONLY the generated document is cached — the registry used to
 * build it is ephemeral, created fresh inside `getOpenApiDocument` on each
 * cache miss. That ensures every invocation is a pure function of the code:
 * calling the generator multiple times never leaks state between calls.
 */
let cachedDocument: OpenAPIObject | null = null;

/**
 * Human-readable top-level description shown on the Scalar docs homepage.
 * Explains how to authenticate via the "Authorize" button so API consumers
 * can immediately test protected endpoints using a real login flow.
 */
const API_DESCRIPTION = `
Interactive documentation for the Aquário UFPB API.

**Authentication:** most endpoints require a JWT bearer token. To test authenticated
endpoints in this UI:

1. Call \`POST /auth/login\` with valid credentials to obtain a token.
2. Copy the \`token\` value from the response.
3. Click the **Authorize** button at the top right of this page.
4. Paste the token as a Bearer credential and click **Authorize**.

All subsequent "Try it out" requests will include the token automatically.

**Error responses:** every 4xx and 5xx response follows the shared \`ApiErrorBody\`
schema with a \`message\` (human-readable) and a \`code\` (machine-readable, see the
\`ErrorCode\` enum). Use the \`code\` for programmatic handling.

**Languages:** descriptions are written in English for a broader audience, but
error messages returned by the API are in Portuguese (as served to end users).
`.trim();

/**
 * Lazily build and cache the OpenAPI document. Subsequent calls return the
 * exact same object reference so the underlying JSON serialization can be
 * cached by Next.js and downstream consumers.
 *
 * On a cache miss, a fresh registry is created, the common component schemas
 * are registered on it, and every path group is registered in turn. The
 * resulting document is frozen in the module-level cache and returned on all
 * subsequent calls until the cache is cleared (in tests or on hot reload).
 */
export function getOpenApiDocument(): OpenAPIObject {
  if (cachedDocument) {
    return cachedDocument;
  }

  const registry = createRegistry();
  const schemas = registerCommonSchemas(registry);
  registerAllPaths(registry, schemas);

  const generator = new OpenApiGeneratorV31(registry.definitions);

  cachedDocument = generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Aquário UFPB API",
      version: packageJson.version,
      description: API_DESCRIPTION,
      contact: {
        name: "Aquário UFPB",
        email: "aquarioufpb@gmail.com",
        url: "https://www.aquarioufpb.com",
      },
      license: {
        name: "MIT",
        url: "https://github.com/aquario-ufpb/aquario/blob/main/LICENSE",
      },
    },
    servers: [
      { url: "https://www.aquarioufpb.com", description: "Production" },
      { url: "http://localhost:3000", description: "Local development" },
    ],
    tags: OPENAPI_TAGS.map(tag => ({ ...tag })),
  });

  return cachedDocument;
}

/**
 * Test-only helper: reset the cached document so tests can re-run document
 * generation in isolation. Safe to call repeatedly — since each call to
 * `getOpenApiDocument()` now builds its own registry, there is no cross-call
 * state to leak.
 */
export function __resetOpenApiCacheForTests(): void {
  cachedDocument = null;
}
