/** @jest-environment node */
import { getDisciplineImpact } from "../discipline-impact";
import { parseRequirement } from "../requirements";
import type { PlannerGoal } from "../types";
const goal = (
  code: string,
  name: string,
  prerequisite: string | null = null,
  extra: Partial<PlannerGoal> = {}
): PlannerGoal => ({
  code,
  name,
  prerequisite: parseRequirement(prerequisite),
  corequisite: null,
  requirementsKnown: true,
  completed: false,
  priority: "optional",
  workload: 60,
  equivalents: [],
  unlocks: 0,
  ...extra,
});
const goals = [
  goal("P1", "Fundamentos"),
  goal("A1", "Cálculo I", "P1"),
  goal("B2", "EDO", "A1"),
  goal("C3", "Robótica", "A1 E D4"),
  goal("D4", "Controle"),
  goal("E5", "Métodos", "A1 OU D4"),
];
test("shows named prerequisites and separates AND from OR releases", () => {
  const result = getDisciplineImpact("A1", goals, ["P1"]);
  expect(result.prerequisite).toEqual({ description: "Fundamentos (P1)", state: "met" });
  expect(result.unlocked.map(item => item.code)).toEqual(["B2", "E5"]);
  expect(result.pending).toEqual([
    { code: "C3", name: "Robótica", detail: "Ainda requer: Controle (D4)" },
  ]);
});
test("does not claim to block a discipline already eligible through another OR branch", () => {
  expect(getDisciplineImpact("A1", goals, ["P1", "D4"]).unlocked.map(item => item.code)).toEqual([
    "B2",
    "C3",
  ]);
});
test("ignores completed dependents and uses simulated approvals without changing the input", () => {
  const original = JSON.stringify(goals);
  const result = getDisciplineImpact("A1", goals, ["P1", "B2"], ["D4"]);
  expect(result.unlocked.map(item => item.code)).toEqual(["C3"]);
  expect(result.pending).toEqual([]);
  expect(JSON.stringify(goals)).toBe(original);
});
test("unverified dependency rules never become confirmed releases", () => {
  const result = getDisciplineImpact(
    "A1",
    [goal("A1", "Cálculo I"), goal("B2", "EDO", "A1", { requirementsKnown: false })],
    []
  );
  expect(result.unlocked).toEqual([]);
  expect(result.pending[0].detail).toBe("Requisitos a verificar: Cálculo I (A1)");
});
test("no prerequisite or dependent relationship returns no display sections", () => {
  expect(getDisciplineImpact("Z9", [goal("Z9", "Administração")], [])).toEqual({
    prerequisite: null,
    unlocked: [],
    pending: [],
  });
});
test("preserves unknown prerequisite codes instead of inventing names", () => {
  expect(getDisciplineImpact("A1", [goal("A1", "Cálculo I", "X9")], []).prerequisite).toEqual({
    description: "X9",
    state: "unmet",
  });
});
