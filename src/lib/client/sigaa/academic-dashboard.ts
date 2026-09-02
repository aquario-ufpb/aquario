import type {
  EffectiveAcademicComponent,
  SigaaAcademicSnapshotPayload,
} from "@/lib/shared/types/sigaa-academic";

export type GradeOutcome =
  | "approved"
  | "failed_absence"
  | "failed_grade"
  | "in_progress"
  | "unknown";

export type GradeSummary = Readonly<{
  total: number;
  approved: number;
  failedAbsence: number;
  failedGrade: number;
  inProgress: number;
  unknown: number;
  recognizedFinals: number;
  approvalRate: number | null;
}>;

export type ComponentScope = "trajectory" | "pending" | "all";

export type GradeTone = "danger" | "warning" | "success" | "neutral";

export type AcademicGrade = SigaaAcademicSnapshotPayload["grades"][number];

export type ComponentPeriodGroup = Readonly<{
  key: string;
  period: number | null;
  label: string;
  components: readonly EffectiveAcademicComponent[];
}>;

export type GradeSemesterGroup = Readonly<{
  semester: string;
  grades: readonly AcademicGrade[];
}>;

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toUpperCase();

export function normalizeGradeOutcome(status: string | null): GradeOutcome {
  if (!status) {
    return "unknown";
  }

  const normalized = normalizeText(status);
  if (/FALTA/.test(normalized) && /REP|REPROV/.test(normalized)) {
    return "failed_absence";
  }
  if (/\b(APROVADO|APROVEITADO|DISPENSADO)\b/.test(normalized)) {
    return "approved";
  }
  if (/REP|REPROV/.test(normalized)) {
    return "failed_grade";
  }
  if (/CURSANDO|MATRICULAD|EM CURSO|ABERTO/.test(normalized)) {
    return "in_progress";
  }
  return "unknown";
}

export function summarizeGrades(grades: readonly AcademicGrade[]): GradeSummary {
  const counts = {
    approved: 0,
    failedAbsence: 0,
    failedGrade: 0,
    inProgress: 0,
    unknown: 0,
  };

  for (const grade of grades) {
    const outcome = normalizeGradeOutcome(grade.status);
    if (outcome === "approved") {
      counts.approved += 1;
    } else if (outcome === "failed_absence") {
      counts.failedAbsence += 1;
    } else if (outcome === "failed_grade") {
      counts.failedGrade += 1;
    } else if (outcome === "in_progress") {
      counts.inProgress += 1;
    } else {
      counts.unknown += 1;
    }
  }

  const recognizedFinals = counts.approved + counts.failedAbsence + counts.failedGrade;
  return {
    total: grades.length,
    ...counts,
    recognizedFinals,
    approvalRate: recognizedFinals === 0 ? null : (counts.approved / recognizedFinals) * 100,
  };
}

export function parseGradeValue(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 10 ? parsed : null;
}

export function getGradeTone(value: string | null, approved = false): GradeTone {
  if (approved) {
    return "success";
  }
  const parsed = parseGradeValue(value);
  if (parsed === null) {
    return "neutral";
  }
  if (parsed < 5) {
    return "danger";
  }
  if (parsed < 7) {
    return "warning";
  }
  return "success";
}

const repairedDescriptions = new Map([
  ["basica profissional", "Básica Profissional"],
  ["bsica profissional", "Básica Profissional"],
  ["complementar obrigatoria", "Complementar Obrigatória"],
  ["complementar obrigatria", "Complementar Obrigatória"],
  ["complementar optativa", "Complementar Optativa"],
  ["complementar flexivel", "Complementar Flexível"],
  ["complementar flexvel", "Complementar Flexível"],
]);

export function repairKnownAcademicDescription(description: string): string {
  const lookupKey = description
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f\uFFFD]/g, "")
    .replace(/\s+/g, " ");

  return repairedDescriptions.get(lookupKey) ?? description;
}

export function componentMatchesScope(
  component: EffectiveAcademicComponent,
  scope: ComponentScope
): boolean {
  if (scope === "all") {
    return true;
  }
  if (scope === "pending") {
    return component.presentation.state === "pending";
  }
  return ["completed", "enrolled"].includes(component.presentation.state);
}

export function countComponentsByScope(
  components: readonly EffectiveAcademicComponent[]
): Readonly<Record<ComponentScope, number>> {
  return {
    trajectory: components.filter(component => componentMatchesScope(component, "trajectory"))
      .length,
    pending: components.filter(component => componentMatchesScope(component, "pending")).length,
    all: components.length,
  };
}

export function groupAcademicComponents(
  components: readonly EffectiveAcademicComponent[],
  scope: ComponentScope,
  search: string
): readonly ComponentPeriodGroup[] {
  const searchTerms = normalizeText(search).split(/\s+/).filter(Boolean);
  const groups = new Map<number | null, EffectiveAcademicComponent[]>();

  for (const component of components) {
    if (!componentMatchesScope(component, scope)) {
      continue;
    }
    const searchableText = normalizeText(`${component.code} ${component.presentation.name}`);
    if (searchTerms.some(term => !searchableText.includes(term))) {
      continue;
    }

    const sourcePeriod = component.sigaa?.period;
    const period = sourcePeriod && sourcePeriod > 0 ? sourcePeriod : null;
    groups.set(period, [...(groups.get(period) ?? []), component]);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => {
      if (left === null) {
        return -1;
      }
      if (right === null) {
        return 1;
      }
      return left - right;
    })
    .map(([period, groupedComponents]) => ({
      key: period === null ? "without-period" : `period-${period}`,
      period,
      label: period === null ? "Sem período" : `${period}º período`,
      components: groupedComponents,
    }));
}

const compareSemestersDescending = (left: string, right: string): number =>
  right.localeCompare(left, "pt-BR", { numeric: true, sensitivity: "base" });

export function groupGradesBySemester(
  grades: readonly AcademicGrade[],
  outcome: GradeOutcome | "all"
): readonly GradeSemesterGroup[] {
  const groups = new Map<string, AcademicGrade[]>();
  for (const grade of grades) {
    if (outcome !== "all" && normalizeGradeOutcome(grade.status) !== outcome) {
      continue;
    }
    groups.set(grade.semester, [...(groups.get(grade.semester) ?? []), grade]);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => compareSemestersDescending(left, right))
    .map(([semester, semesterGrades]) => ({ semester, grades: semesterGrades }));
}
