import type { GradeDisciplinaNode } from "@/lib/shared/types/curriculo.types";
import type {
  SigaaAcademicComponent,
  ManualAcademicComponent,
} from "@/lib/shared/types/sigaa-academic";
import { combineAcademicDisplay, normalizeAcademicCode } from "./combine-academic-display";

/** Apply the same source precedence as Academic, translating codes to this grade's local ids. */
export function curriculumStatus(
  disciplines: readonly GradeDisciplinaNode[],
  manualCompletedIds: readonly string[],
  manualEnrolledIds: readonly string[],
  imported: readonly SigaaAcademicComponent[]
) {
  const completed = new Set(manualCompletedIds);
  const enrolled = new Set(manualEnrolledIds);
  const catalog = disciplines.map(item => ({
    disciplinaId: item.disciplinaId,
    code: item.codigo,
    name: item.nome,
  }));
  const display = combineAcademicDisplay({
    catalog,
    manual: catalog.flatMap<ManualAcademicComponent>(item =>
      completed.has(item.disciplinaId)
        ? [{ ...item, state: "completed" as const }]
        : enrolled.has(item.disciplinaId)
          ? [{ ...item, state: "enrolled" as const }]
          : []
    ),
    sigaa: imported,
  });
  const completedIds = new Set<string>();
  const enrolledIds = new Set<string>();
  const missing: { code: string; name: string }[] = [];
  for (const item of display) {
    if (!item.catalog) {
      if (item.presentation.state === "completed" || item.presentation.state === "enrolled") {
        missing.push({ code: normalizeAcademicCode(item.code), name: item.presentation.name });
      }
      continue;
    }
    if (item.presentation.state === "completed") {
      completedIds.add(item.catalog.disciplinaId);
    }
    if (item.presentation.state === "enrolled") {
      enrolledIds.add(item.catalog.disciplinaId);
    }
  }
  return { completedIds, enrolledIds, missing };
}
