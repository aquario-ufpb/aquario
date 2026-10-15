import type { GradeCurricularResponse } from "../types/curriculo.types";
import type { SigaaAcademicSnapshotPayload } from "../types/sigaa-academic";
import { normalizeCurriculumCode } from "../sigaa/curriculum-code";
import { normalizeCode, parseRequirement } from "./requirements";
import type { PlannerGoal } from "./types";

export function buildAcademicContext(
  grade: GradeCurricularResponse | null,
  snapshot: SigaaAcademicSnapshotPayload | null,
  manualCompleted: string[]
) {
  const completed = new Set(manualCompleted.map(normalizeCode));
  const components = new Map(
    snapshot?.curriculum.components.map(item => [normalizeCode(item.code), item]) ?? []
  );
  for (const component of components.values()) {
    if (component.status === "completed") {
      completed.add(normalizeCode(component.code));
    } else {
      completed.delete(normalizeCode(component.code));
    }
  }
  const matched = Boolean(
    grade &&
    (!snapshot ||
      normalizeCurriculumCode(grade.curriculoCodigo) ===
        normalizeCurriculumCode(snapshot.curriculum.code))
  );
  // Expand only explicit directional catalog equivalences applicable to this curriculum.
  const directlyCompleted = new Set(completed);
  if (matched && grade) {
    for (const discipline of grade.disciplinas) {
      if (discipline.equivalencias.some(code => directlyCompleted.has(normalizeCode(code)))) {
        completed.add(normalizeCode(discipline.codigo));
      }
    }
  }
  const goals: PlannerGoal[] = (grade?.disciplinas ?? []).map(item => {
    const code = normalizeCode(item.codigo);
    const imported = components.get(code);
    return {
      code,
      name: imported?.name ?? item.nome,
      curricularRequired: imported?.required ?? item.natureza === "OBRIGATORIA",
      period: imported ? imported.period : item.periodo,
      priority: item.natureza === "OBRIGATORIA" ? "high" : "optional",
      equivalents: matched ? item.equivalencias.map(normalizeCode) : [],
      workload: imported?.workloadHours ?? item.cargaHorariaTotal,
      prerequisite: imported
        ? parseRequirement(imported.prerequisite)
        : item.preRequisitos.length
          ? {
              kind: "all",
              items: item.preRequisitos.map(req => ({ kind: "code", code: normalizeCode(req) })),
            }
          : null,
      corequisite: imported ? parseRequirement(imported.corequisite) : null,
      requirementsKnown: matched && Boolean(imported),
      completed: completed.has(code),
      unlocks: (grade?.disciplinas ?? []).filter(candidate =>
        candidate.preRequisitos.map(normalizeCode).includes(code)
      ).length,
    };
  });
  for (const component of components.values()) {
    if (!goals.some(goal => goal.code === normalizeCode(component.code))) {
      goals.push({
        code: normalizeCode(component.code),
        name: component.name,
        period: component.period,
        curricularRequired: component.required,
        priority: component.required ? "high" : "optional",
        equivalents: [],
        workload: component.workloadHours,
        prerequisite: parseRequirement(component.prerequisite),
        corequisite: parseRequirement(component.corequisite),
        requirementsKnown: true,
        completed: component.status === "completed",
        unlocks: 0,
      });
    }
  }
  return {
    goals,
    completedCodes: [...completed],
    enrolledCodes: [...components.values()]
      .filter(item => item.status === "enrolled")
      .map(item => normalizeCode(item.code)),
    curriculumMatched: matched,
  };
}
