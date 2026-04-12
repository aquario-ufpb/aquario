import { OpenAPIRegistry, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

/**
 * Extend Zod with the `.openapi()` method. This is a global, idempotent
 * operation: calling it multiple times has no effect, so keeping it at module
 * top level is safe. Every consumer that defines Zod schemas with `.openapi()`
 * metadata must ensure this file has been imported at least once before the
 * schemas are evaluated — importing `createRegistry` or any path module
 * transitively triggers it.
 */
extendZodWithOpenApi(z);

/**
 * Create a fresh OpenAPI registry, pre-configured with the shared security
 * schemes used across the API.
 *
 * **The registry is intentionally NOT a module-level singleton.** An earlier
 * version of this file exported a global registry, which caused `registerPath`
 * calls to accumulate across multiple `getOpenApiDocument()` invocations when
 * the document cache was invalidated (e.g., in Jest `beforeEach` or Next.js
 * dev-mode hot reload). The result was a monotonically growing `definitions`
 * array and linear slowdown between calls.
 *
 * Making the registry ephemeral guarantees that `getOpenApiDocument()` is a
 * pure function of the code deployed, with no hidden cross-call state.
 */
export function createRegistry(): OpenAPIRegistry {
  const registry = new OpenAPIRegistry();

  // Bearer JWT security scheme used by every authenticated endpoint.
  // Matches the Authorization: Bearer <token> format enforced by
  // withAuth/withAdmin middlewares in src/lib/server/services/auth/middleware.ts.
  registry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description:
      "Token JWT obtido via POST /auth/login. Enviar no header `Authorization: Bearer <token>`.",
  });

  return registry;
}

/**
 * OpenAPI tags used to group operations in the documentation UI.
 * One tag per resource group under src/app/api/, in the order they should
 * appear. Dev endpoints (src/app/api/dev/) are intentionally NOT listed —
 * they only run in development (IS_DEV guard) and are excluded from the
 * public documentation.
 *
 * Kept as a module-level constant because it is pure data with no lifecycle.
 */
export const OPENAPI_TAGS = [
  {
    name: "Autenticação",
    description: "Login, cadastro, recuperação de senha e verificação de email",
  },
  { name: "Usuários", description: "Perfis, membresias, fotos, onboarding e currículo" },
  { name: "Entidades", description: "Organizações estudantis, laboratórios e demais entidades" },
  { name: "Vagas", description: "Estágios, empregos e oportunidades publicadas pelas entidades" },
  { name: "Guias", description: "Guias acadêmicos com seções e subseções" },
  { name: "Cursos", description: "Cursos (graduações) da UFPB" },
  { name: "Centros Acadêmicos", description: "Centros acadêmicos da UFPB" },
  { name: "Campus", description: "Campi da UFPB" },
  { name: "Disciplinas", description: "Busca de disciplinas dos cursos" },
  { name: "Currículos", description: "Grades curriculares e árvores de disciplinas" },
  { name: "Calendário Acadêmico", description: "Semestres letivos e eventos do calendário" },
  { name: "Busca", description: "Busca unificada em todas as categorias" },
  { name: "Health", description: "Health check do serviço" },
  { name: "Upload", description: "Endpoints de upload de arquivos" },
  {
    name: "Imagens de Conteúdo",
    description: "Imagens estáticas servidas dos submódulos de conteúdo",
  },
] as const;

/** Tipo derivado: nomes das tags OpenAPI registradas. */
export type OpenApiTagName = (typeof OPENAPI_TAGS)[number]["name"];
