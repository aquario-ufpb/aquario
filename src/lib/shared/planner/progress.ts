import { checkRequirement, normalizeCode } from "./requirements";
import type { PlannerGoal, PlannerProgress, PlannerSettings, Requirement } from "./types";

type Missing = { codes: Set<string>; uncertain: boolean };
const references = (rule: Requirement | null): string[] =>
  !rule || rule.kind === "unknown"
    ? []
    : rule.kind === "code"
      ? [normalizeCode(rule.code)]
      : rule.items.flatMap(references);

/** A prerequisite graph describes progress after approval, never eligibility in the same term. */
export function createProgressPlanner(
  goals: PlannerGoal[],
  completed: Set<string>,
  settings: PlannerSettings
) {
  const byCode = new Map(goals.map(goal => [normalizeCode(goal.code), goal]));
  const target = settings.progressTarget
    ? byCode.get(normalizeCode(settings.progressTarget))
    : undefined;
  const label = (code: string) => ({ code, name: byCode.get(code)?.name ?? code });
  const outgoing = new Map<string, Set<string>>();
  for (const goal of goals) {
    if (!goal.requirementsKnown) {
      continue;
    }
    for (const code of references(goal.prerequisite)) {
      const next = outgoing.get(code) ?? new Set<string>();
      next.add(goal.code);
      outgoing.set(code, next);
    }
  }
  const missing = (goal: PlannerGoal, done: Set<string>): Missing => {
    const cache = new Map<string, Missing>();
    const visit = (rule: Requirement | null, trail: Set<string>): Missing => {
      if (!rule) {
        return { codes: new Set(), uncertain: false };
      }
      if (rule.kind === "unknown") {
        return { codes: new Set(), uncertain: true };
      }
      if (rule.kind === "code") {
        const code = normalizeCode(rule.code);
        if (done.has(code)) {
          return { codes: new Set(), uncertain: false };
        }
        if (trail.has(code)) {
          return { codes: new Set([code]), uncertain: true };
        }
        const cached = cache.get(code);
        if (cached) {
          return cached;
        }
        const parent = byCode.get(code);
        const dependency = parent?.requirementsKnown
          ? visit(parent.prerequisite, new Set([...trail, code]))
          : { codes: new Set<string>(), uncertain: true };
        const answer = {
          codes: new Set([code, ...dependency.codes]),
          uncertain: dependency.uncertain,
        };
        cache.set(code, answer);
        return answer;
      }
      const branches = rule.items.map(item => visit(item, trail));
      if (rule.kind === "any") {
        return branches.sort(
          (a, b) =>
            Number(a.uncertain) - Number(b.uncertain) ||
            a.codes.size - b.codes.size ||
            [...a.codes]
              .sort()
              .join()
              .localeCompare([...b.codes].sort().join())
        )[0];
      }
      return {
        codes: new Set(branches.flatMap(branch => [...branch.codes])),
        uncertain: branches.some(branch => branch.uncertain),
      };
    };
    if (done.has(goal.code)) {
      return { codes: new Set(), uncertain: false };
    }
    return goal.requirementsKnown
      ? visit(goal.prerequisite, new Set([goal.code]))
      : { codes: new Set(), uncertain: true };
  };
  const path = (start: string, destination: string): string[] | null => {
    const queue = [[start]],
      visited = new Set([start]);
    for (let i = 0; i < queue.length; i++) {
      const route = queue[i],
        last = route[route.length - 1];
      if (last === destination) {
        return route;
      }
      for (const next of outgoing.get(last) ?? []) {
        if (!visited.has(next) && !completed.has(next)) {
          visited.add(next);
          queue.push([...route, next]);
        }
      }
    }
    return null;
  };
  const pending = goals.filter(
    goal =>
      !completed.has(goal.code) &&
      !goal.completed &&
      goal.priority !== "exclude" &&
      (settings.includeOptional || goal.curricularRequired !== false)
  );
  const baseline = target ? missing(target, completed) : undefined;
  const reliablePending = pending.filter(goal => !missing(goal, completed).uncertain);
  const downstream = new Map(
    goals.map(goal => [
      goal.code,
      new Set(
        reliablePending
          .filter(other => other.code !== goal.code && path(goal.code, other.code))
          .map(other => other.code)
      ),
    ])
  );
  return {
    weight: (code: string) =>
      settings.progressStrategy === "target" && target
        ? Number(Boolean(path(code, target.code)))
        : (downstream.get(code)?.size ?? 0),
    evaluate: (selected: string[]): { score: number[]; progress: PlannerProgress } => {
      const after = new Set([...completed, ...selected]);
      const unlocked = pending.filter(
        goal =>
          !after.has(goal.code) &&
          goal.requirementsKnown &&
          checkRequirement(goal.prerequisite, completed) === "unmet" &&
          checkRequirement(goal.prerequisite, after) === "met"
      );
      const affected = new Set(
        selected.flatMap(code => [...(downstream.get(code) ?? [])]).filter(code => !after.has(code))
      );
      const remaining = target ? missing(target, after) : undefined;
      const targetPlan =
        target &&
        baseline &&
        remaining &&
        !baseline.uncertain &&
        !remaining.uncertain &&
        !completed.has(target.code)
          ? { target, baseline, remaining }
          : null;
      const gain = targetPlan
        ? Math.max(0, targetPlan.baseline.codes.size - targetPlan.remaining.codes.size)
        : 0;
      const routes = targetPlan
        ? selected.flatMap(code => {
            const route = path(code, targetPlan.target.code);
            return route &&
              (targetPlan.baseline.codes.has(code) || gain > 0 || code === targetPlan.target.code)
              ? [route.map(label)]
              : [];
          })
        : [];
      const warnings: string[] = [];
      if (settings.progressStrategy === "target" && !target) {
        warnings.push("Escolha uma disciplina alvo para orientar o plano.");
      }
      if (settings.progressStrategy === "target" && target && !targetPlan) {
        warnings.push(
          completed.has(target.code)
            ? "A disciplina alvo já está concluída ou considerada aprovada."
            : "O caminho do alvo tem requisitos desconhecidos ou cíclicos; a prioridade pelo grafo não foi aplicada."
        );
      }
      if (settings.progressStrategy !== "balanced" && pending.length !== reliablePending.length) {
        warnings.push(
          "O grafo considera somente os requisitos conhecidos; há regras a verificar no currículo."
        );
      }
      const score =
        settings.progressStrategy === "target"
          ? targetPlan
            ? [Number(selected.includes(targetPlan.target.code)), gain]
            : [0, 0]
          : settings.progressStrategy === "unlock"
            ? [
                unlocked.filter(goal => goal.curricularRequired !== false).length,
                unlocked.length,
                [...affected].filter(code => byCode.get(code)?.curricularRequired !== false).length,
                affected.size,
              ]
            : [];
      return {
        score,
        progress: {
          strategy: settings.progressStrategy,
          target: target ? label(target.code) : null,
          unlocked: unlocked.map(goal => label(goal.code)),
          paths: routes,
          remaining: remaining ? [...remaining.codes].sort().map(label) : [],
          warnings,
        },
      };
    },
  };
}
