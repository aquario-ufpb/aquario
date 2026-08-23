import type { EffectiveAcademicComponent } from "@/lib/shared/types/sigaa-academic";

import {
  countComponentsByScope,
  getGradeTone,
  groupAcademicComponents,
  groupGradesBySemester,
  normalizeGradeOutcome,
  parseGradeValue,
  repairKnownAcademicDescription,
  summarizeGrades,
  type AcademicGrade,
} from "../academic-dashboard";

const grade = (status: string | null, semester = "2026.1"): AcademicGrade => ({
  semester,
  code: `${semester}-${status ?? "unknown"}`,
  discipline: "Componente",
  units: [],
  exam: null,
  result: null,
  absences: null,
  status,
});

const component = (
  code: string,
  state: "completed" | "enrolled" | "pending" | "unknown",
  period: number | null,
  name = code
): EffectiveAcademicComponent => ({
  code,
  catalog: null,
  manual: null,
  sigaa: {
    code,
    name,
    integrationType: "DISCIPLINA",
    period,
    workloadHours: 60,
    required: true,
    status: state,
    prerequisite: null,
    corequisite: null,
  },
  presentation: { origin: "SIGAA", state, name },
});

describe("academic dashboard domain", () => {
  it("normalizes SIGAA outcomes and calculates approval only over recognized finals", () => {
    const grades = [
      grade("APROVADO"),
      grade("Aprovado por média"),
      grade("REP. FALTA"),
      grade("REPROVADO"),
      grade("MATRICULADO"),
      grade("TRANCADO"),
    ];

    expect(grades.map(item => normalizeGradeOutcome(item.status))).toEqual([
      "approved",
      "approved",
      "failed_absence",
      "failed_grade",
      "in_progress",
      "unknown",
    ]);
    expect(summarizeGrades(grades)).toEqual({
      total: 6,
      approved: 2,
      failedAbsence: 1,
      failedGrade: 1,
      inProgress: 1,
      unknown: 1,
      recognizedFinals: 4,
      approvalRate: 50,
    });
  });

  it("parses decimal commas and maps grade thresholds without relying on color alone", () => {
    expect(parseGradeValue("6,9")).toBe(6.9);
    expect(parseGradeValue("fora da faixa")).toBeNull();
    expect(getGradeTone("4,9")).toBe("danger");
    expect(getGradeTone("5,0")).toBe("warning");
    expect(getGradeTone("7,0")).toBe("success");
    expect(getGradeTone("2,0", true)).toBe("success");
  });

  it("repairs known mojibake and missing accents while leaving source values untouched", () => {
    const source = "Complementar Flex\uFFFDvel";
    expect(repairKnownAcademicDescription(source)).toBe("Complementar Flexível");
    expect(repairKnownAcademicDescription("Basica Profissional")).toBe("Básica Profissional");
    expect(repairKnownAcademicDescription("Complementar Obrigatoria")).toBe(
      "Complementar Obrigatória"
    );
    expect(source).toBe("Complementar Flex\uFFFDvel");
    expect(repairKnownAcademicDescription("Descrição desconhecida \uFFFD")).toBe(
      "Descrição desconhecida \uFFFD"
    );
  });

  it("groups the selected scope before ordering no-period and numeric periods", () => {
    const components = [
      component("PENDING-2", "pending", 2),
      component("NO-PERIOD", "completed", 0),
      component("COMPLETED-2", "completed", 2),
      component("ENROLLED-1", "enrolled", 1),
    ];

    expect(countComponentsByScope(components)).toEqual({ trajectory: 3, pending: 1, all: 4 });
    expect(groupAcademicComponents(components, "trajectory", "").map(group => group.label)).toEqual(
      ["Sem período", "1º período", "2º período"]
    );
    expect(groupAcademicComponents(components, "pending", "")[0]?.components).toHaveLength(1);
    expect(groupAcademicComponents(components, "all", "ENROLLED")[0]?.label).toBe("1º período");
  });

  it("matches component searches without requiring accents", () => {
    const components = [component("ALG-1", "completed", 1, "ÁLGEBRA E COMPUTAÇÃO")];

    expect(groupAcademicComponents(components, "trajectory", "algebra computacao")).toHaveLength(1);
  });

  it("orders grade semesters from newest to oldest after applying the outcome filter", () => {
    const grades = [grade("APROVADO", "2023.2"), grade("REPROVADO", "2026.1")];
    expect(groupGradesBySemester(grades, "all").map(group => group.semester)).toEqual([
      "2026.1",
      "2023.2",
    ]);
    expect(groupGradesBySemester(grades, "approved").map(group => group.semester)).toEqual([
      "2023.2",
    ]);
  });
});
