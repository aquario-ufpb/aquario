import { normalizeCode } from "./requirements";
import type { PlannerGoal } from "./types";

/** Coverage includes every pending curriculum component, including collapsed level-zero electives. */
export function curriculumSearchCodes(goals: readonly PlannerGoal[]): string[] {
  return [
    ...new Set(
      goals
        .filter(goal => !goal.completed && goal.priority !== "exclude")
        .flatMap(goal => [goal.code, ...goal.equivalents])
        .map(normalizeCode)
        .filter(code => /^[A-Z0-9]{1,64}$/.test(code))
    ),
  ].sort();
}
