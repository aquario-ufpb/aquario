import { OpenAPIRegistry, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

/**
 * Extend Zod with .openapi() method.
 *
 * IMPORTANT: This must be called exactly once, before any schema uses .openapi().
 * Since this file is the entry point for the OpenAPI infrastructure and is imported
 * by every module that touches the registry, calling it here guarantees the extension
 * is applied before any consumer runs.
 */
extendZodWithOpenApi(z);

/**
 * Global OpenAPI registry. All component schemas and paths are registered here.
 * Consumed by generator.ts to produce the final OpenAPI document.
 */
export const registry = new OpenAPIRegistry();

/**
 * Bearer JWT security scheme used by all authenticated endpoints.
 * Matches the Authorization: Bearer <token> format enforced by withAuth/withAdmin
 * middlewares in src/lib/server/services/auth/middleware.ts.
 */
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "JWT token obtained via POST /auth/login. Send as 'Authorization: Bearer <token>'.",
});

/**
 * OpenAPI tags used to group operations in the documentation UI.
 * One tag per resource group under src/app/api/, in the order they should appear.
 * Dev endpoints (src/app/api/dev/) are intentionally NOT listed — they only run
 * in development (IS_DEV guard) and are excluded from the public documentation.
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
