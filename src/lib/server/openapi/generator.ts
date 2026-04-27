import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import type { OpenAPIObject } from "openapi3-ts/oas31";

import packageJson from "../../../../package.json";

import { registerCommonSchemas } from "./common-schemas";
import { createRegistry, OPENAPI_TAGS } from "./registry";
import { registerAllPaths } from "./paths";

// Cached per process lifetime; reset on hot reload in dev and by __resetOpenApiCacheForTests in tests.
let cachedDocument: OpenAPIObject | null = null;

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
      { url: "https://www.aquarioufpb.com/api", description: "Produção" },
      { url: "http://localhost:3000/api", description: "Desenvolvimento local" },
    ],
    tags: OPENAPI_TAGS.map(tag => ({ ...tag })),
  });

  return cachedDocument;
}

export function __resetOpenApiCacheForTests(): void {
  cachedDocument = null;
}
