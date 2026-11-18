/** @jest-environment node */
import { buildRequirementGraph } from "../requirement-graph";
import { parseRequirement } from "../requirements";
import type { PlannerGoal } from "../types";

const goal = (
  code: string,
  prerequisite: string | null = null,
  extra: Partial<PlannerGoal> = {}
): PlannerGoal => ({
  code,
  name: code,
  prerequisite: parseRequirement(prerequisite),
  corequisite: null,
  requirementsKnown: true,
  completed: false,
  curricularRequired: true,
  priority: "optional",
  workload: 60,
  equivalents: [],
  unlocks: 0,
  ...extra,
});
const need = (graph: ReturnType<typeof buildRequirementGraph>, code: string) => {
  const found = graph.byCode.get(code);
  if (!found) {
    throw new Error(`missing goal ${code}`);
  }
  return found;
};
const sorted = (codes: Set<string>) => [...codes].sort();
const chain = [goal("P1"), goal("A1", "P1"), goal("B2", "A1")];

describe("buildRequirementGraph", () => {
  it("missing returns the transitive chain", () => {
    const graph = buildRequirementGraph(chain);
    const result = graph.missing(need(graph, "B2"), new Set());
    expect(sorted(result.codes)).toEqual(["A1", "P1"]);
    expect(result.uncertain).toBe(false);
    expect(sorted(graph.missing(need(graph, "B2"), new Set(["P1"])).codes)).toEqual(["A1"]);
  });

  it("missing is uncertain for cycles, unknown ancestors and codes outside the curriculum", () => {
    const cyclic = buildRequirementGraph([goal("C1", "C2"), goal("C2", "C1")]);
    expect(cyclic.missing(need(cyclic, "C1"), new Set()).uncertain).toBe(true);
    const unknown = buildRequirementGraph([
      goal("U1", null, { requirementsKnown: false }),
      goal("G", "U1"),
    ]);
    const unknownResult = unknown.missing(need(unknown, "G"), new Set());
    expect(sorted(unknownResult.codes)).toEqual(["U1"]);
    expect(unknownResult.uncertain).toBe(true);
    const outside = buildRequirementGraph([goal("G", "X9")]);
    const outsideResult = outside.missing(need(outside, "G"), new Set());
    expect(sorted(outsideResult.codes)).toEqual(["X9"]);
    expect(outsideResult.uncertain).toBe(true);
  });

  it("missing keeps the any-branch tie-break", () => {
    const flat = buildRequirementGraph([goal("X1"), goal("Y1"), goal("G", "X1 OU Y1")]);
    expect(sorted(flat.missing(need(flat, "G"), new Set()).codes)).toEqual(["X1"]);
    const deep = buildRequirementGraph([
      goal("X1", "W1"),
      goal("W1"),
      goal("Y1"),
      goal("G", "X1 OU Y1"),
    ]);
    expect(sorted(deep.missing(need(deep, "G"), new Set()).codes)).toEqual(["Y1"]);
  });

  it("missing honors waivers", () => {
    const graph = buildRequirementGraph(chain);
    const b2 = need(graph, "B2");
    const pair = graph.missing(b2, new Set(), [{ target: "b2", requires: " a1 " }]);
    expect(sorted(pair.codes)).toEqual([]);
    expect(pair.uncertain).toBe(false);
    const whole = graph.missing(b2, new Set(), [{ target: "B2" }]);
    expect(sorted(whole.codes)).toEqual([]);
    expect(whole.uncertain).toBe(false);
    const other = graph.missing(b2, new Set(), [{ target: "A1" }]);
    expect(sorted(other.codes)).toEqual(["A1", "P1"]);
    // A waiver applies only to the requested goal, never to its ancestors.
    const ancestor = graph.missing(b2, new Set(), [{ target: "B2", requires: "P1" }]);
    expect(sorted(ancestor.codes)).toEqual(["A1", "P1"]);
  });

  it("reachable skips blocked nodes", () => {
    const graph = buildRequirementGraph(chain);
    expect(sorted(graph.reachable("P1"))).toEqual(["A1", "B2"]);
    expect(sorted(graph.reachable("P1", new Set(["A1"])))).toEqual([]);
    expect(sorted(graph.reachable("P1", new Set(["P1"])))).toEqual(["A1", "B2"]);
  });

  it("path returns the shortest route or null", () => {
    const graph = buildRequirementGraph([...chain, goal("C3", "P1 E B2")]);
    expect(graph.path("P1", "C3")).toEqual(["P1", "C3"]);
    expect(graph.path("P1", "B2")).toEqual(["P1", "A1", "B2"]);
    expect(graph.path("B2", "P1")).toBeNull();
    expect(graph.path("P1", "B2", new Set(["A1"]))).toBeNull();
  });

  it("missing does not depend on the evaluation order inside a cycle", () => {
    const goals = [
      goal("X1"),
      goal("A1", "B1 OU X1"),
      goal("B1", "A1"),
      goal("G1", "A1 E B1"),
      goal("G2", "B1 E A1"),
    ];
    const graph = buildRequirementGraph(goals);
    const a = graph.missing(need(graph, "G1"), new Set());
    const b = graph.missing(need(graph, "G2"), new Set());
    expect([...a.codes].sort()).toEqual([...b.codes].sort());
    expect(a.uncertain).toBe(b.uncertain);
  });

  it("with uncertainAny, an OR with an unmet unreadable branch stays uncertain", () => {
    const goals = [goal("P1"), goal("A1", "P1"), goal("H1", "A1 OU ZZ99")];
    const loose = buildRequirementGraph(goals);
    expect(loose.missing(need(loose, "H1"), new Set()).uncertain).toBe(false);
    const strict = buildRequirementGraph(goals, { uncertainAny: true });
    const result = strict.missing(need(strict, "H1"), new Set());
    expect(result.uncertain).toBe(true);
    expect([...result.codes].sort()).toEqual(["A1", "P1"]);
    expect(strict.missing(need(strict, "H1"), new Set(["A1"])).uncertain).toBe(false);
  });
});
