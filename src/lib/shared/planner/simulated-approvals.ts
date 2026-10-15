import { normalizeCode } from "./requirements";
import type { PlannerGoal } from "./types";

/** Project assumptions for this calculation, preserving the original goals and history. */
export function simulateApprovals(goals: PlannerGoal[], assumedCodes: string[]) {
  const direct = new Set(assumedCodes.map(normalizeCode));
  const assumed = new Set(direct);
  for (const goal of goals) {
    // Only use explicit directional equivalents; never infer transitive credit.
    if (goal.equivalents.some(code => direct.has(normalizeCode(code)))) {
      assumed.add(normalizeCode(goal.code));
    }
  }
  return {
    assumedPassedCodes: [...assumed],
    goals: goals.map(goal =>
      assumed.has(normalizeCode(goal.code)) ? { ...goal, completed: true } : goal
    ),
  };
}
