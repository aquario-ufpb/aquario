import { checkRequirement, normalizeCode, remainingRequirement } from "./requirements";
import type { PlannerGoal, Requirement } from "./types";

export type Missing = { codes: Set<string>; uncertain: boolean };
/** Without `requires`, waives every requirement of `target`; with it, only that code. */
export type Waiver = { target: string; requires?: string };
export type RequirementGraph = {
  byCode: Map<string, PlannerGoal>;
  /** code -> goals whose prerequisite cites it */
  outgoing: Map<string, Set<string>>;
  missing(goal: PlannerGoal, done: Set<string>, waivers?: Waiver[]): Missing;
  /** Starts at `from` even if blocked; never enters a blocked node. */
  reachable(from: string, blocked?: Set<string>): Set<string>;
  path(start: string, destination: string, blocked?: Set<string>): string[] | null;
};

export const references = (rule: Requirement | null): string[] =>
  !rule || rule.kind === "unknown"
    ? []
    : rule.kind === "code"
      ? [normalizeCode(rule.code)]
      : rule.items.flatMap(references);

export type GraphOptions = {
  /**
   * An OR with an unmet branch that cannot be read (code outside the curriculum, unknown rule)
   * is uncertain even when another branch is known: the unreadable one may already hold.
   * The schedule solver keeps the optimistic default.
   */
  uncertainAny?: boolean;
};

export function buildRequirementGraph(
  goals: PlannerGoal[],
  { uncertainAny = false }: GraphOptions = {}
): RequirementGraph {
  const byCode = new Map(goals.map(goal => [normalizeCode(goal.code), goal]));
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
  // ponytail: each call copies `codes` per level (O(depth²) on a very deep chain); share a
  // per-`done` cache across calls if deep curricula show up.
  const missing = (goal: PlannerGoal, done: Set<string>, waivers: Waiver[] = []): Missing => {
    const empty = (): Missing => ({ codes: new Set(), uncertain: false });
    const waiverFor = (code: string) => {
      const own = waivers.filter(waiver => normalizeCode(waiver.target) === code);
      return {
        whole: own.some(waiver => waiver.requires === undefined),
        skip: new Set(
          own.flatMap(waiver => (waiver.requires ? [normalizeCode(waiver.requires)] : []))
        ),
      };
    };
    const root = normalizeCode(goal.code);
    const rootWaiver = waiverFor(root);
    if (rootWaiver.whole || done.has(goal.code)) {
      return empty();
    }
    if (!goal.requirementsKnown) {
      return { codes: new Set(), uncertain: true };
    }

    // Requirement edges still open for `code`: not done, not waived, inside the curriculum.
    const edges = (code: string): string[] => {
      const node = byCode.get(code);
      const waiver = waiverFor(code);
      if (!node?.requirementsKnown || waiver.whole) {
        return [];
      }
      // Only what is still unmet: an OR already met by `done` adds no edge back into a cycle.
      return references(remainingRequirement(node.prerequisite, done)).filter(
        ref => !done.has(ref) && !waiver.skip.has(ref) && byCode.has(ref)
      );
    };
    // Tarjan from the goal: every node in a cycle maps to its component. Results then never
    // depend on the path taken to reach a node, so each code is evaluated once.
    const order = new Map<string, number>(),
      low = new Map<string, number>(),
      stack: string[] = [],
      cycles = new Map<string, string[]>();
    const lowOf = (code: string) => low.get(code) ?? 0;
    const strong = (code: string) => {
      order.set(code, order.size);
      low.set(code, order.size - 1);
      stack.push(code);
      for (const next of edges(code)) {
        if (!order.has(next)) {
          strong(next);
          low.set(code, Math.min(lowOf(code), lowOf(next)));
        } else if (stack.includes(next)) {
          low.set(code, Math.min(lowOf(code), order.get(next) ?? 0));
        }
      }
      if (lowOf(code) === order.get(code)) {
        const members = stack.splice(stack.indexOf(code));
        if (members.length > 1 || edges(code).includes(code)) {
          for (const member of members) {
            cycles.set(member, members);
          }
        }
      }
    };
    strong(root);

    const cache = new Map<string, Missing>();
    const visit = (rule: Requirement | null, skip: Set<string>): Missing => {
      if (!rule) {
        return empty();
      }
      if (rule.kind === "unknown") {
        return { codes: new Set(), uncertain: true };
      }
      if (rule.kind === "code") {
        const code = normalizeCode(rule.code);
        return done.has(code) || skip.has(code) ? empty() : evaluate(code);
      }
      // A group already met (by history or by a waiver) has nothing left to expand. This also
      // keeps the walk inside the edges used to detect cycles.
      if (checkRequirement(rule, new Set([...done, ...skip])) === "met") {
        return empty();
      }
      const branches = rule.items.map(item => visit(item, skip));
      if (rule.kind === "any") {
        const hidden = branches.some(branch => branch.uncertain);
        const best = [...branches].sort(
          (a, b) =>
            Number(a.uncertain) - Number(b.uncertain) ||
            a.codes.size - b.codes.size ||
            [...a.codes]
              .sort()
              .join()
              .localeCompare([...b.codes].sort().join())
        )[0];
        // A branch already met (nothing missing, certain) settles the OR.
        return uncertainAny && hidden && best.codes.size > 0 ? { ...best, uncertain: true } : best;
      }
      return {
        codes: new Set(branches.flatMap(branch => [...branch.codes])),
        uncertain: branches.some(branch => branch.uncertain),
      };
    };
    const evaluate = (code: string): Missing => {
      const cached = cache.get(code);
      if (cached) {
        return cached;
      }
      const members = cycles.get(code);
      let answer: Missing;
      if (members) {
        // A cycle cannot be resolved: keep every member and whatever hangs off it, uncertain.
        const codes = new Set(members);
        for (const member of members) {
          for (const ref of edges(member).filter(ref => !members.includes(ref))) {
            evaluate(ref).codes.forEach(item => codes.add(item));
          }
        }
        answer = { codes, uncertain: true };
        members.forEach(member => cache.set(member, answer));
        return answer;
      }
      const parent = byCode.get(code);
      const waiver = waiverFor(code);
      if (!parent?.requirementsKnown) {
        answer = { codes: new Set([code]), uncertain: true };
      } else if (waiver.whole) {
        answer = { codes: new Set([code]), uncertain: false };
      } else {
        const dependency = visit(parent.prerequisite, waiver.skip);
        answer = { codes: new Set([code, ...dependency.codes]), uncertain: dependency.uncertain };
      }
      cache.set(code, answer);
      return answer;
    };
    return visit(goal.prerequisite, rootWaiver.skip);
  };
  const reachable = (from: string, blocked: Set<string> = new Set()): Set<string> => {
    const seen = new Set<string>();
    const queue = [from];
    for (let i = 0; i < queue.length; i++) {
      for (const next of outgoing.get(queue[i]) ?? []) {
        if (next !== from && !seen.has(next) && !blocked.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    return seen;
  };
  const path = (
    start: string,
    destination: string,
    blocked: Set<string> = new Set()
  ): string[] | null => {
    const queue = [[start]],
      visited = new Set([start]);
    for (let i = 0; i < queue.length; i++) {
      const route = queue[i],
        last = route[route.length - 1];
      if (last === destination) {
        return route;
      }
      for (const next of outgoing.get(last) ?? []) {
        if (!visited.has(next) && !blocked.has(next)) {
          visited.add(next);
          queue.push([...route, next]);
        }
      }
    }
    return null;
  };
  return { byCode, outgoing, missing, reachable, path };
}
