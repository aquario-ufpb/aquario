import { buildRequirementGraph } from "./requirement-graph";
import { checkRequirement, normalizeCode } from "./requirements";
import type { PlannerGoal, PlannerProgress, PlannerSettings } from "./types";

/** A prerequisite graph describes progress after approval, never eligibility in the same term. */
export function createProgressPlanner(
  goals: PlannerGoal[],
  completed: Set<string>,
  settings: PlannerSettings
) {
  const graph = buildRequirementGraph(goals);
  const { byCode, missing } = graph;
  const target = settings.progressTarget
    ? byCode.get(normalizeCode(settings.progressTarget))
    : undefined;
  const label = (code: string) => ({ code, name: byCode.get(code)?.name ?? code });
  const path = (start: string, destination: string) => graph.path(start, destination, completed);
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
    goals.map(goal => {
      const reach = graph.reachable(goal.code, completed);
      return [
        goal.code,
        new Set(reliablePending.filter(other => reach.has(other.code)).map(other => other.code)),
      ];
    })
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
