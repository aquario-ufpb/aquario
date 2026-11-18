import { normalizeCode } from "./requirements";
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
  // ponytail: copies `trail` and `codes` per level, O(depth²) per call (~1 s per pass on a
  // 500-deep chain); share a per-`done` cache across calls if deep curricula show up.
  const missing = (goal: PlannerGoal, done: Set<string>, waivers: Waiver[] = []): Missing => {
    const own = waivers.filter(waiver => normalizeCode(waiver.target) === normalizeCode(goal.code));
    if (own.some(waiver => waiver.requires === undefined)) {
      return { codes: new Set(), uncertain: false };
    }
    const waived = new Set(
      own.flatMap(waiver => (waiver.requires ? [normalizeCode(waiver.requires)] : []))
    );
    const cache = new Map<string, Missing>();
    // Counts trail hits: an answer computed through one depends on the active path, so it is not cached.
    let cuts = 0;
    // `skip` holds the waived codes; it is only passed at the requested goal's own level.
    const visit = (rule: Requirement | null, trail: Set<string>, skip: Set<string>): Missing => {
      if (!rule) {
        return { codes: new Set(), uncertain: false };
      }
      if (rule.kind === "unknown") {
        return { codes: new Set(), uncertain: true };
      }
      if (rule.kind === "code") {
        const code = normalizeCode(rule.code);
        if (done.has(code) || skip.has(code)) {
          return { codes: new Set(), uncertain: false };
        }
        if (trail.has(code)) {
          cuts++;
          return { codes: new Set([code]), uncertain: true };
        }
        const cached = cache.get(code);
        if (cached) {
          return cached;
        }
        const before = cuts;
        const parent = byCode.get(code);
        const dependency = parent?.requirementsKnown
          ? visit(parent.prerequisite, new Set([...trail, code]), new Set())
          : { codes: new Set<string>(), uncertain: true };
        const answer = {
          codes: new Set([code, ...dependency.codes]),
          uncertain: dependency.uncertain,
        };
        if (cuts === before) {
          cache.set(code, answer);
        }
        return answer;
      }
      const branches = rule.items.map(item => visit(item, trail, skip));
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
    if (done.has(goal.code)) {
      return { codes: new Set(), uncertain: false };
    }
    return goal.requirementsKnown
      ? visit(goal.prerequisite, new Set([goal.code]), waived)
      : { codes: new Set(), uncertain: true };
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
