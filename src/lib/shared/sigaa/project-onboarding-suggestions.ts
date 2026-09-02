import type {
  CatalogAcademicComponent,
  ManualAcademicComponent,
  SigaaAcademicSnapshotPayload,
} from "@/lib/shared/types/sigaa-academic";
import { normalizeAcademicCode } from "@/lib/shared/sigaa/combine-academic-display";

type SelectionState = ManualAcademicComponent["state"];

export type SigaaOnboardingConflict = Readonly<{
  code: string;
  disciplinaId: string;
  sigaaState: SelectionState;
  manualState: SelectionState;
}>;

export type SigaaOnboardingSelectionProjection = Readonly<{
  suggestedDisciplineIds: readonly string[];
  alreadySavedDisciplineIds: readonly string[];
  conflicts: readonly SigaaOnboardingConflict[];
  unmatchedCodes: readonly string[];
}>;

export type SigaaOnboardingSuggestions = Readonly<{
  completed: SigaaOnboardingSelectionProjection;
  enrolled: SigaaOnboardingSelectionProjection;
  enrollmentSemester: "matched" | "mismatched" | "unavailable";
  ignoredEnrolledCodes: readonly string[];
}>;

export type ProjectSigaaOnboardingSuggestionsInput = Readonly<{
  snapshot: SigaaAcademicSnapshotPayload;
  catalog: readonly CatalogAcademicComponent[];
  manual: readonly ManualAcademicComponent[];
  activeSemester: string | null;
}>;

const emptyProjection = (): {
  suggestedDisciplineIds: string[];
  alreadySavedDisciplineIds: string[];
  conflicts: SigaaOnboardingConflict[];
  unmatchedCodes: string[];
} => ({
  suggestedDisciplineIds: [],
  alreadySavedDisciplineIds: [],
  conflicts: [],
  unmatchedCodes: [],
});

/**
 * Projects a validated SIGAA snapshot into suggestions for the existing
 * onboarding selections. This function deliberately performs no writes.
 */
export const projectSigaaOnboardingSuggestions = ({
  snapshot,
  catalog,
  manual,
  activeSemester,
}: ProjectSigaaOnboardingSuggestionsInput): SigaaOnboardingSuggestions => {
  const catalogGroups = new Map<string, CatalogAcademicComponent[]>();
  for (const discipline of catalog) {
    const code = normalizeAcademicCode(discipline.code);
    const group = catalogGroups.get(code) ?? [];
    group.push(discipline);
    catalogGroups.set(code, group);
  }

  const manualStatesByCode = new Map<string, Set<SelectionState>>();
  for (const discipline of manual) {
    const code = normalizeAcademicCode(discipline.code);
    const states = manualStatesByCode.get(code) ?? new Set<SelectionState>();
    states.add(discipline.state);
    manualStatesByCode.set(code, states);
  }

  const sourceSemester = snapshot.identity.sourceSemester
    ? normalizeAcademicCode(snapshot.identity.sourceSemester)
    : null;
  const normalizedActiveSemester = activeSemester ? normalizeAcademicCode(activeSemester) : null;
  const enrollmentSemester =
    sourceSemester === null || normalizedActiveSemester === null
      ? "unavailable"
      : sourceSemester === normalizedActiveSemester
        ? "matched"
        : "mismatched";

  const completed = emptyProjection();
  const enrolled = emptyProjection();
  const ignoredEnrolledCodes: string[] = [];
  const seen = {
    completed: new Set<string>(),
    enrolled: new Set<string>(),
  };

  for (const component of snapshot.curriculum.components) {
    if (component.status !== "completed" && component.status !== "enrolled") {
      continue;
    }

    const state = component.status;
    const code = normalizeAcademicCode(component.code);
    if (seen[state].has(code)) {
      continue;
    }
    seen[state].add(code);

    if (state === "enrolled" && enrollmentSemester !== "matched") {
      ignoredEnrolledCodes.push(code);
      continue;
    }

    const projection = state === "completed" ? completed : enrolled;
    const catalogMatches = catalogGroups.get(code);
    if (!catalogMatches || catalogMatches.length !== 1) {
      projection.unmatchedCodes.push(code);
      continue;
    }

    const discipline = catalogMatches[0];
    const manualStates = manualStatesByCode.get(code);
    const oppositeState: SelectionState = state === "completed" ? "enrolled" : "completed";

    if (manualStates?.has(oppositeState)) {
      projection.conflicts.push({
        code,
        disciplinaId: discipline.disciplinaId,
        sigaaState: state,
        manualState: oppositeState,
      });
      continue;
    }

    if (manualStates?.has(state)) {
      projection.alreadySavedDisciplineIds.push(discipline.disciplinaId);
      continue;
    }

    projection.suggestedDisciplineIds.push(discipline.disciplinaId);
  }

  return {
    completed,
    enrolled,
    enrollmentSemester,
    ignoredEnrolledCodes,
  };
};
