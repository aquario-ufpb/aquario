import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

/**
 * Register every path in the OpenAPI registry. Called once by the generator
 * during lazy document creation. Keep the calls ordered by resource group
 * so the resulting paths object matches the tag order in registry.ts.
 *
 * As each resource group is documented, its `register*Paths` function will
 * be added here (see src/lib/server/openapi/paths/auth.ts, usuarios.ts, etc).
 */
export function registerAllPaths(_registry: OpenAPIRegistry): void {
  // Intentionally empty for now. Each resource group is registered
  // incrementally across subsequent commits in this PR.
}
