import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { registerAuthPaths } from "./auth";
import { registerCalendarioPaths } from "./calendario";
import { registerCampusPaths } from "./campus";
import { registerCentrosPaths } from "./centros";
import { registerCurriculosPaths } from "./curriculos";
import { registerCursosPaths } from "./cursos";
import { registerDisciplinasPaths } from "./disciplinas";
import { registerEntidadesPaths } from "./entidades";
import { registerGuiasPaths } from "./guias";
import { registerMiscPaths } from "./misc";
import { registerSearchPaths } from "./search";
import { registerUsuariosPaths } from "./usuarios";
import { registerVagasPaths } from "./vagas";

/**
 * Register every path in the OpenAPI registry. Called once by the generator
 * during lazy document creation. Keep the calls ordered by resource group
 * so the resulting paths object matches the tag order in registry.ts.
 *
 * As each resource group is documented, its `register*Paths` function will
 * be added here (see src/lib/server/openapi/paths/auth.ts, usuarios.ts, etc).
 */
export function registerAllPaths(registry: OpenAPIRegistry): void {
  registerAuthPaths(registry);
  registerUsuariosPaths(registry);
  registerEntidadesPaths(registry);
  registerVagasPaths(registry);
  registerGuiasPaths(registry);
  registerCursosPaths(registry);
  registerCentrosPaths(registry);
  registerCampusPaths(registry);
  registerDisciplinasPaths(registry);
  registerCurriculosPaths(registry);
  registerCalendarioPaths(registry);
  registerSearchPaths(registry);
  registerMiscPaths(registry);
}
