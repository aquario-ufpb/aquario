import { buildRequirementGraph, references, type Missing, type Waiver } from "./requirement-graph";
import { checkRequirement, normalizeCode, remainingRequirement } from "./requirements";
import { simulateApprovals } from "./simulated-approvals";
import type { PlannerGoal, Requirement } from "./types";

export type BlockingItem = { code: string; name: string; optional: boolean };
export type BlockedItem = BlockingItem & {
  pendingRule: Requirement | null;
  chain: string[];
  dependents: number;
};
export type BlockingInput = {
  goals: PlannerGoal[];
  completedCodes: string[];
  assumedPassedCodes?: string[];
  selected: string[];
  waivers?: Waiver[];
};
export type BlockingAnalysis = {
  available: (BlockingItem & { noRegisteredRequirement: boolean })[];
  unlockedLater: BlockingItem[];
  blocked: BlockedItem[];
  delayed: { cause: BlockingItem; delays: BlockingItem[] }[];
  toVerify: BlockingItem[];
  invalidSelected: string[];
  ignoredSelected: string[];
  creditedBySelection: string[];
};

const byCodeOrder = (a: { code: string }, b: { code: string }) => a.code.localeCompare(b.code);
const item = (goal: PlannerGoal): BlockingItem => ({
  code: goal.code,
  name: goal.name,
  optional: goal.curricularRequired === false,
});

/** What happens to each pending discipline if the selection S is approved this term. */
export function analyzeBlocking({
  goals,
  completedCodes,
  assumedPassedCodes = [],
  selected,
  waivers = [],
}: BlockingInput): BlockingAnalysis {
  // Deliberate divergence from the schedule solver, which is more conservative: a discipline with
  // no registered requirement counts as "Disponível agora" here (the UI flags it with a badge).
  const isUnregistered = (goal: PlannerGoal) => !goal.requirementsKnown && !goal.prerequisite;
  // Same rule inside the graph: an unregistered root is a known ancestor, otherwise every
  // discipline that descends from it would be reported as "A verificar".
  const graph = buildRequirementGraph(
    goals.map(goal => (isUnregistered(goal) ? { ...goal, requirementsKnown: true } : goal)),
    { uncertainAny: true }
  );
  const projection = simulateApprovals(goals, assumedPassedCodes);
  const done = new Set(
    [
      ...completedCodes,
      ...projection.assumedPassedCodes,
      ...projection.goals.filter(goal => goal.completed).map(goal => goal.code),
    ].map(normalizeCode)
  );
  const key = (goal: PlannerGoal) => normalizeCode(goal.code);
  /** Codes counted as done for `goal`'s own rule, or null when a waiver lifts it entirely. */
  const credited = (goal: PlannerGoal, codes: Set<string>): Set<string> | null => {
    const own = waivers.filter(waiver => normalizeCode(waiver.target) === key(goal));
    if (own.some(waiver => waiver.requires === undefined)) {
      return null;
    }
    return own.length
      ? new Set([
          ...codes,
          ...own.flatMap(waiver => (waiver.requires ? [normalizeCode(waiver.requires)] : [])),
        ])
      : codes;
  };
  const satisfied = (goal: PlannerGoal, codes: Set<string>) => {
    const set = credited(goal, codes);
    return !set || checkRequirement(goal.prerequisite, set) === "met";
  };
  const availableIn = (goal: PlannerGoal, codes: Set<string>) =>
    isUnregistered(goal) || (goal.requirementsKnown && satisfied(goal, codes));

  const invalidSelected: string[] = [],
    ignoredSelected: string[] = [],
    chosen: string[] = [];
  for (const code of new Set(selected.map(normalizeCode))) {
    const goal = graph.byCode.get(code);
    if (done.has(code)) {
      ignoredSelected.push(code);
    } else if (goal && availableIn(goal, done)) {
      chosen.push(code);
    } else {
      invalidSelected.push(code);
    }
  }
  // Equivalences are credited from S′ only, never re-derived from H (no transitive credit).
  const fromSelection = simulateApprovals(goals, chosen).assumedPassedCodes;
  const after = new Set([...done, ...fromSelection]);
  const creditedBySelection = fromSelection.filter(
    code => !chosen.includes(code) && !done.has(code)
  );

  const memo = (codes: Set<string>) => {
    const cache = new Map<string, Missing>();
    return (goal: PlannerGoal) => {
      const answer = cache.get(key(goal)) ?? graph.missing(goal, codes, waivers);
      cache.set(key(goal), answer);
      return answer;
    };
  };
  const missingNow = memo(done);

  const pending = goals.filter(goal => !after.has(key(goal)));
  const pendingCodes = new Set(pending.map(key));
  const available: BlockingAnalysis["available"] = [],
    unlockedLater: BlockingItem[] = [],
    blockedGoals: PlannerGoal[] = [],
    toVerify: BlockingItem[] = [];
  for (const goal of pending) {
    if (!goal.requirementsKnown && !isUnregistered(goal)) {
      toVerify.push(item(goal));
    } else if (availableIn(goal, done)) {
      available.push({ ...item(goal), noRegisteredRequirement: isUnregistered(goal) });
    } else if (satisfied(goal, after)) {
      unlockedLater.push(item(goal));
    } else if (graph.missing(goal, after, waivers).uncertain) {
      toVerify.push(item(goal));
    } else {
      blockedGoals.push(goal);
    }
  }

  /** Pending ancestors, each after its own prerequisites (Kahn, ties by code). */
  const chainOf = (goal: PlannerGoal) => {
    const left = missingNow(goal).codes;
    const waiting = new Map<string, number>(),
      children = new Map<string, string[]>();
    for (const code of left) {
      // Only the branches still unmet: a resolved OR must not add edges back to its other side.
      const parents = new Set(
        references(remainingRequirement(graph.byCode.get(code)?.prerequisite ?? null, done)).filter(
          ref => left.has(ref)
        )
      );
      waiting.set(code, parents.size);
      for (const parent of parents) {
        children.set(parent, [...(children.get(parent) ?? []), code]);
      }
    }
    const ready = [...left].filter(code => waiting.get(code) === 0).sort(),
      chain: string[] = [];
    while (ready.length) {
      const code = ready.shift() as string;
      chain.push(code);
      for (const child of children.get(code) ?? []) {
        const count = (waiting.get(child) ?? 0) - 1;
        waiting.set(child, count);
        if (count === 0) {
          ready.push(child);
          ready.sort();
        }
      }
    }
    // A cycle cannot be ordered; append what is left in code order.
    const placed = new Set(chain);
    return [...chain, ...[...left].filter(code => !placed.has(code)).sort()];
  };
  const blocked = blockedGoals.map(goal => ({
    ...item(goal),
    pendingRule: remainingRequirement(goal.prerequisite, credited(goal, after) ?? after),
    chain: chainOf(goal),
    dependents: [...graph.reachable(key(goal), done)].filter(code => {
      const dependent = graph.byCode.get(code);
      return dependent && pendingCodes.has(code) && !missingNow(dependent).uncertain;
    }).length,
  }));

  // Every available discipline is a candidate X (S′ is already outside `available`): pruning by
  // `missing` would miss X credited through equivalences and the unchosen branch of an OR.
  const delayed = available.flatMap(entry => {
    const code = normalizeCode(entry.code);
    const cause = graph.byCode.get(code);
    if (!cause) {
      return [];
    }
    const extra = new Set([...after, ...simulateApprovals(goals, [code]).assumedPassedCodes]);
    const delays = blockedGoals.filter(goal => satisfied(goal, extra)).map(item);
    return delays.length ? [{ cause: item(cause), delays: delays.sort(byCodeOrder) }] : [];
  });

  return {
    available: available.sort(byCodeOrder),
    unlockedLater: unlockedLater.sort(byCodeOrder),
    blocked: blocked.sort(byCodeOrder),
    delayed: delayed.sort((a, b) => byCodeOrder(a.cause, b.cause)),
    toVerify: toVerify.sort(byCodeOrder),
    invalidSelected: invalidSelected.sort(),
    ignoredSelected: ignoredSelected.sort(),
    creditedBySelection: creditedBySelection.sort(),
  };
}
