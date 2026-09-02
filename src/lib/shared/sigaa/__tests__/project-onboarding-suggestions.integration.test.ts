import { describe, expect, it } from "vitest";
import type {
  CatalogAcademicComponent,
  ManualAcademicComponent,
  SigaaAcademicComponent,
  SigaaAcademicSnapshotPayload,
} from "@/lib/shared/types/sigaa-academic";
import { projectSigaaOnboardingSuggestions } from "../project-onboarding-suggestions";

const component = (
  code: string,
  status: SigaaAcademicComponent["status"]
): SigaaAcademicComponent => ({
  code,
  name: code,
  integrationType: "OBRIGATORIA",
  period: 1,
  workloadHours: 60,
  required: true,
  status,
  prerequisite: null,
  corequisite: null,
});

const snapshot = (
  components: readonly SigaaAcademicComponent[],
  sourceSemester: string | null = "2026.1"
): SigaaAcademicSnapshotPayload => ({
  identity: { matricula: "20260000001", sourceCourse: "Engenharia", sourceSemester },
  curriculum: {
    code: "CUR-1",
    maximumCompletionTerm: null,
    semesterWorkload: { minimum: null, maximum: null },
    cra: { value: null, source: "unavailable" },
    progress: [],
    components,
  },
  grades: [],
  classes: [],
});

const catalog: readonly CatalogAcademicComponent[] = [
  { disciplinaId: "d1", code: "GDSCO001", name: "Algoritmos" },
  { disciplinaId: "d2", code: "GDSCO002", name: "Estruturas" },
  { disciplinaId: "d3", code: "GDSCO003", name: "Redes" },
];

describe("projectSigaaOnboardingSuggestions", () => {
  it("maps unique normalized completed and active-semester enrolled codes", () => {
    const result = projectSigaaOnboardingSuggestions({
      snapshot: snapshot([
        component("  gdsco001  ", "completed"),
        component("ＧＤＳＣＯ００２", "enrolled"),
      ]),
      catalog,
      manual: [],
      activeSemester: "2026.1",
    });

    expect(result.completed.suggestedDisciplineIds).toEqual(["d1"]);
    expect(result.enrolled.suggestedDisciplineIds).toEqual(["d2"]);
    expect(result.enrollmentSemester).toBe("matched");
  });

  it("separates already-saved selections and blocks opposite manual conflicts", () => {
    const manual: readonly ManualAcademicComponent[] = [
      { disciplinaId: "d1", code: "GDSCO001", name: "Algoritmos", state: "completed" },
      { disciplinaId: "d2", code: "GDSCO002", name: "Estruturas", state: "completed" },
    ];
    const result = projectSigaaOnboardingSuggestions({
      snapshot: snapshot([component("GDSCO001", "completed"), component("GDSCO002", "enrolled")]),
      catalog,
      manual,
      activeSemester: "2026.1",
    });

    expect(result.completed.alreadySavedDisciplineIds).toEqual(["d1"]);
    expect(result.completed.suggestedDisciplineIds).toEqual([]);
    expect(result.enrolled.suggestedDisciplineIds).toEqual([]);
    expect(result.enrolled.conflicts).toEqual([
      {
        code: "GDSCO002",
        disciplinaId: "d2",
        sigaaState: "enrolled",
        manualState: "completed",
      },
    ]);
  });

  it("does not suggest enrolled disciplines from another or unknown semester", () => {
    for (const sourceSemester of ["2025.2", null]) {
      const result = projectSigaaOnboardingSuggestions({
        snapshot: snapshot([component("GDSCO003", "enrolled")], sourceSemester),
        catalog,
        manual: [],
        activeSemester: "2026.1",
      });

      expect(result.enrolled.suggestedDisciplineIds).toEqual([]);
      expect(result.ignoredEnrolledCodes).toEqual(["GDSCO003"]);
      expect(result.enrollmentSemester).toBe(sourceSemester ? "mismatched" : "unavailable");
    }
  });

  it("reports missing and ambiguous catalog codes instead of guessing", () => {
    const result = projectSigaaOnboardingSuggestions({
      snapshot: snapshot([component("UNKNOWN", "completed"), component("GDSCO001", "completed")]),
      catalog: [...catalog, { disciplinaId: "duplicate", code: " gdsco001 ", name: "Duplicada" }],
      manual: [],
      activeSemester: "2026.1",
    });

    expect(result.completed.suggestedDisciplineIds).toEqual([]);
    expect(result.completed.unmatchedCodes).toEqual(["UNKNOWN", "GDSCO001"]);
  });

  it("deduplicates repeated normalized source codes and performs no input mutation", () => {
    const inputSnapshot = snapshot([
      component("GDSCO001", "completed"),
      component(" gdsco001 ", "completed"),
    ]);
    const before = JSON.stringify(inputSnapshot);

    const result = projectSigaaOnboardingSuggestions({
      snapshot: inputSnapshot,
      catalog,
      manual: [],
      activeSemester: "2026.1",
    });

    expect(result.completed.suggestedDisciplineIds).toEqual(["d1"]);
    expect(JSON.stringify(inputSnapshot)).toBe(before);
  });
});
