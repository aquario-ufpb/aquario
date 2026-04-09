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
Documentação interativa da API do Aquário UFPB.

**Autenticação:** a maior parte dos endpoints exige um token JWT. Para testar
endpoints autenticados aqui na UI:

1. Chame \`POST /auth/login\` com credenciais válidas para obter um token.
2. Copie o valor do campo \`token\` da resposta.
3. Clique no botão **Authorize** no topo da página.
4. Cole o token como credencial Bearer e clique em **Authorize**.

A partir daí, todas as chamadas "Try it out" incluirão o token automaticamente.

**Respostas de erro:** toda resposta 4xx e 5xx segue o formato \`ApiErrorBody\`,
com um campo \`message\` (legível por humanos, em português) e um \`code\`
(legível por máquina — ver o enum \`ErrorCode\`). Use o \`code\` para tratamento
programático dos erros.
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
      { url: "https://www.aquarioufpb.com", description: "Produção" },
      { url: "http://localhost:3000", description: "Desenvolvimento local" },
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
