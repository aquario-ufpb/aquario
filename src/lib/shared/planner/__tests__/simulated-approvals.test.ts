/** @jest-environment node */
import { simulateApprovals } from "../simulated-approvals";
import type { PlannerGoal } from "../types";
const goal = (code: string, equivalents: string[] = []): PlannerGoal => ({
  code,
  name: code,
  equivalents,
  priority: "optional",
  workload: 60,
  prerequisite: null,
  corequisite: null,
  requirementsKnown: true,
  completed: false,
  unlocks: 0,
});
it("projects explicit equivalences once and restores goals when assumptions are disabled", () => {
  const goals = [goal("A1", ["B2"]), goal("B2", ["C3"]), goal("C3")];
  const simulated = simulateApprovals(goals, ["c3"]);
  expect(simulated.assumedPassedCodes.sort()).toEqual(["B2", "C3"]);
  expect(simulated.goals.map(goal => goal.completed)).toEqual([false, true, true]);
  expect(simulateApprovals(goals, []).goals.every(goal => !goal.completed)).toBe(true);
  expect(goals.every(goal => !goal.completed)).toBe(true);
});
