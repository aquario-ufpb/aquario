import {
  checkRequirement,
  describeRequirement,
  normalizeCode,
  remainingRequirement,
} from "./requirements";
import { simulateApprovals } from "./simulated-approvals";
import type { PlannerGoal, Requirement } from "./types";

const contains = (rule: Requirement | null, code: string): boolean => {
  if (!rule || rule.kind === "unknown") {
    return false;
  }
  return rule.kind === "code"
    ? normalizeCode(rule.code) === code
    : rule.items.some(item => contains(item, code));
};
export type DisciplineImpactItem = { code: string; name: string; detail?: string };
export type DisciplineImpact = {
  prerequisite: { description: string; state: "met" | "unmet" | "unknown" } | null;
  unlocked: DisciplineImpactItem[];
  pending: DisciplineImpactItem[];
};
/** Direct academic dependencies, after approval in the clicked discipline only. */
export function getDisciplineImpact(
  code: string,
  goals: PlannerGoal[],
  completedCodes: string[],
  assumedPassedCodes: string[] = []
): DisciplineImpact {
  const projection = simulateApprovals(goals, assumedPassedCodes);
  const completed = new Set(
    [
      ...completedCodes,
      ...projection.assumedPassedCodes,
      ...projection.goals.filter(goal => goal.completed).map(goal => goal.code),
    ].map(normalizeCode)
  );
  const byCode = new Map(goals.map(goal => [normalizeCode(goal.code), goal]));
  const activeCode = normalizeCode(code),
    goal = byCode.get(activeCode);
  const label = (value: string) => {
    const name = byCode.get(normalizeCode(value))?.name;
    return name && normalizeCode(name) !== normalizeCode(value) ? `${name} (${value})` : value;
  };
  const prerequisite = goal?.prerequisite
    ? {
        description: describeRequirement(goal.prerequisite, label),
        state: goal.requirementsKnown
          ? checkRequirement(goal.prerequisite, completed)
          : ("unknown" as const),
      }
    : null;
  const after = new Set([...completed, activeCode]);
  const unlocked: DisciplineImpactItem[] = [],
    pending: DisciplineImpactItem[] = [];
  for (const candidate of projection.goals) {
    if (
      normalizeCode(candidate.code) === activeCode ||
      completed.has(normalizeCode(candidate.code)) ||
      !contains(candidate.prerequisite, activeCode) ||
      checkRequirement(candidate.prerequisite, completed) === "met"
    ) {
      continue;
    }
    if (candidate.requirementsKnown && checkRequirement(candidate.prerequisite, after) === "met") {
      unlocked.push({ code: candidate.code, name: candidate.name });
    } else {
      pending.push({
        code: candidate.code,
        name: candidate.name,
        detail: candidate.requirementsKnown
          ? `Ainda requer: ${describeRequirement(remainingRequirement(candidate.prerequisite, after), label)}`
          : `Requisitos a verificar: ${describeRequirement(candidate.prerequisite, label)}`,
      });
    }
  }
  const compare = (a: DisciplineImpactItem, b: DisciplineImpactItem) =>
    a.name.localeCompare(b.name, "pt-BR") || a.code.localeCompare(b.code);
  return { prerequisite, unlocked: unlocked.sort(compare), pending: pending.sort(compare) };
}
