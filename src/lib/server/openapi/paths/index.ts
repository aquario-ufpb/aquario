import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import type { CommonSchemas } from "../common-schemas";
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
 * The `schemas` argument is the set of shared component schemas (ErrorCode,
 * ApiErrorBody, PaginationMeta, the `errorResponses` helper) created by
 * `registerCommonSchemas` on the same registry. Path modules receive it as
 * a second argument so they can reference the shared error envelope without
 * importing module-level singletons.
 */
export function registerAllPaths(registry: OpenAPIRegistry, schemas: CommonSchemas): void {
  registerAuthPaths(registry, schemas);
  registerUsuariosPaths(registry, schemas);
  registerEntidadesPaths(registry, schemas);
  registerVagasPaths(registry, schemas);
  registerGuiasPaths(registry, schemas);
  registerCursosPaths(registry, schemas);
  registerCentrosPaths(registry, schemas);
  registerCampusPaths(registry, schemas);
  registerDisciplinasPaths(registry, schemas);
  registerCurriculosPaths(registry, schemas);
  registerCalendarioPaths(registry, schemas);
  registerSearchPaths(registry, schemas);
  registerMiscPaths(registry, schemas);
}
