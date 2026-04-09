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
      "JWT token obtained via POST /auth/login. Send as 'Authorization: Bearer <token>'.",
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
    name: "Auth",
    description: "Authentication, registration, password recovery and email verification",
  },
  { name: "Users", description: "User profiles, memberships, photos, onboarding and curriculum" },
  { name: "Entities", description: "Student organizations, labs, and other UFPB entities" },
  { name: "Vagas", description: "Job and internship listings" },
  { name: "Guides", description: "Academic guides with sections and subsections" },
  { name: "Courses", description: "UFPB courses (majors)" },
  { name: "Academic Centers", description: "UFPB academic centers" },
  { name: "Campus", description: "UFPB campi" },
  { name: "Disciplines", description: "Course disciplines and search" },
  { name: "Curricula", description: "Curriculum grids and discipline trees" },
  { name: "Academic Calendar", description: "Semesters and academic events" },
  { name: "Search", description: "Unified full-text search across all entities" },
  { name: "Health", description: "Service health check" },
  { name: "Upload", description: "File upload endpoints" },
  { name: "Content Images", description: "Static image serving from content submodules" },
] as const;

export type OpenApiTagName = (typeof OPENAPI_TAGS)[number]["name"];
