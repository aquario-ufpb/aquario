/** @jest-environment node */
import { analyzeBlocking, type BlockingAnalysis, type BlockingInput } from "../blocking-analysis";
import { parseRequirement } from "../requirements";
import type { PlannerGoal } from "../types";

const goal = (
  code: string,
  prerequisite: string | null = null,
  extra: Partial<PlannerGoal> = {}
): PlannerGoal => ({
  code,
  name: `Nome ${code}`,
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
const goals = [
  goal("P1"),
  goal("A1", "P1"),
  goal("B2", "A1"),
  goal("C3", "A1 E D4"),
  goal("D4"),
  goal("E5", "A1 OU D4"),
  goal("O1", "A1", { curricularRequired: false }),
  goal("K9", null, { requirementsKnown: false }),
  goal("U8", null, {
    requirementsKnown: false,
    prerequisite: { kind: "unknown", raw: "Consultar coordenação" },
  }),
  goal("X1", "X2"),
  goal("X2", "X1"),
  goal("F6", "ZZ99"),
  goal("G9", null, { equivalents: ["A1"] }),
];
const run = (input: Partial<BlockingInput> & { completedCodes: string[]; selected: string[] }) =>
  analyzeBlocking({ goals, ...input });
const codes = (items: { code: string }[]) => items.map(item => item.code);
const groups = (result: BlockingAnalysis) => [
  ...codes(result.available),
  ...codes(result.unlockedLater),
  ...codes(result.blocked),
  ...codes(result.toVerify),
];
const find = <T extends { code: string }>(items: T[], code: string) => {
  const found = items.find(item => item.code === code);
  if (!found) {
    throw new Error(`missing ${code}`);
  }
  return found;
};

describe("analyzeBlocking", () => {
  it("classifies pending disciplines after selecting A1", () => {
    const result = run({ completedCodes: ["P1"], selected: ["A1"] });
    expect(codes(result.unlockedLater)).toEqual(["B2", "E5", "O1"]);
    expect(find(result.unlockedLater, "O1").optional).toBe(true);
    expect(find(result.unlockedLater, "B2").optional).toBe(false);
    expect(codes(result.blocked)).toEqual(["C3"]);
    expect(result.blocked[0].pendingRule).toEqual({ kind: "code", code: "D4" });
    expect(result.delayed.map(entry => [entry.cause.code, codes(entry.delays)])).toEqual([
      ["D4", ["C3"]],
    ]);
    expect(codes(result.available)).toEqual(expect.arrayContaining(["D4", "K9"]));
    expect(codes(result.available)).not.toContain("A1");
    expect(find(result.available, "K9").noRegisteredRequirement).toBe(true);
    expect(find(result.available, "D4").noRegisteredRequirement).toBe(false);
    expect(codes(result.toVerify)).toEqual(["F6", "U8", "X1", "X2"]);
    expect(result.creditedBySelection).toEqual(["G9"]);
    expect(groups(result)).not.toContain("G9");
    expect(groups(result)).not.toContain("P1");
  });

  it("reports delays, dependents and chains with nothing selected", () => {
    const result = run({ completedCodes: [], selected: [] });
    expect(result.delayed.map(entry => [entry.cause.code, codes(entry.delays)])).toEqual([
      ["D4", ["E5"]],
      ["P1", ["A1"]],
    ]);
    expect(find(result.blocked, "A1").dependents).toBe(4);
    expect(find(result.blocked, "B2").chain).toEqual(["P1", "A1"]);
    expect(find(result.blocked, "C3").chain).toEqual(["D4", "P1", "A1"]);
    expect(find(result.blocked, "B2").dependents).toBe(0);
    expect(codes(result.toVerify)).toEqual(expect.arrayContaining(["X1", "X2"]));
    expect(codes(result.blocked)).not.toContain("X1");
  });

  it("rejects unavailable and already completed selections", () => {
    const invalid = run({ completedCodes: ["P1"], selected: ["B2"] });
    expect(invalid.invalidSelected).toEqual(["B2"]);
    expect(codes(invalid.blocked)).toContain("B2");
    expect(run({ completedCodes: ["P1"], selected: ["P1"] }).ignoredSelected).toEqual(["P1"]);
  });

  it("does not count one selection as completed for another", () => {
    const result = run({ completedCodes: ["P1"], selected: ["A1", "B2"] });
    expect(result.invalidSelected).toEqual(["B2"]);
    // Spec: B2 stays pending and is classified against H′, where A1 is assumed.
    expect(codes(result.unlockedLater)).toContain("B2");
  });

  it("never credits equivalences transitively over H", () => {
    const result = analyzeBlocking({
      goals: [goal("W0", null, { equivalents: ["R0"] }), goal("R0", null, { equivalents: ["Q0"] })],
      completedCodes: ["Q0"],
      selected: [],
    });
    expect(result.creditedBySelection).toEqual([]);
    expect(codes(result.available)).toEqual(["R0", "W0"]);
  });

  it("applies waivers by pair and by discipline", () => {
    const pair = run({
      completedCodes: ["P1"],
      selected: ["A1"],
      waivers: [{ target: "C3", requires: "D4" }],
    });
    expect(codes(pair.unlockedLater)).toContain("C3");
    const whole = run({ completedCodes: [], selected: [], waivers: [{ target: "C3" }] });
    expect(codes(whole.available)).toContain("C3");
  });

  it("keeps excluded disciplines in the analysis", () => {
    const result = analyzeBlocking({
      goals: goals.map(item => (item.code === "A1" ? { ...item, priority: "exclude" } : item)),
      completedCodes: [],
      selected: [],
    });
    expect(codes(result.blocked)).toContain("A1");
  });

  it("uses goal completion, normalizes selection and tolerates unknown codes", () => {
    const result = analyzeBlocking({
      goals: goals.map(item => (item.code === "P1" ? { ...item, completed: true } : item)),
      completedCodes: [],
      selected: [" a1 ", "A1", "nada"],
    });
    expect(groups(result)).not.toContain("P1");
    expect(groups(result)).not.toContain("A1");
    expect(codes(result.unlockedLater)).toContain("B2");
    expect(result.invalidSelected).toEqual(["NADA"]);
  });

  it("delays through a direct equivalence of X", () => {
    const result = analyzeBlocking({
      goals: [goal("Q1"), goal("X1"), goal("Z1", "Q1", { equivalents: ["X1"] }), goal("G1", "Z1")],
      completedCodes: [],
      selected: [],
    });
    expect(result.delayed.map(entry => [entry.cause.code, codes(entry.delays)])).toEqual([
      ["Q1", ["Z1"]],
      ["X1", ["G1"]],
    ]);
  });

  it("delays through every branch of an OR", () => {
    const result = analyzeBlocking({
      goals: [goal("Y1"), goal("D4"), goal("G1", "Y1 OU D4")],
      completedCodes: [],
      selected: [],
    });
    expect(codes(result.blocked)).toEqual(["G1"]);
    expect(result.delayed.map(entry => [entry.cause.code, codes(entry.delays)])).toEqual([
      ["D4", ["G1"]],
      ["Y1", ["G1"]],
    ]);
  });

  it("leaves uncertain dependents out of dependents", () => {
    const result = analyzeBlocking({
      goals: [goal("P1"), goal("A1", "P1"), goal("B2", "A1"), goal("F7", "A1 E ZZ99")],
      completedCodes: [],
      selected: [],
    });
    expect(find(result.blocked, "A1").dependents).toBe(1);
    expect(codes(result.toVerify)).toEqual(["F7"]);
  });

  it("does not leak a pair waiver to ancestors", () => {
    const result = analyzeBlocking({
      goals: [goal("P1"), goal("A1", "P1"), goal("B2", "A1"), goal("C3", "B2")],
      completedCodes: [],
      selected: [],
      waivers: [{ target: "C3", requires: "A1" }],
    });
    expect(codes(result.blocked)).toEqual(["A1", "B2", "C3"]);
    expect(find(result.blocked, "C3").chain).toEqual(["P1", "A1", "B2"]);
  });

  it("appends a cycle remainder to chain without stalling", () => {
    const result = analyzeBlocking({
      goals: [
        goal("E1"),
        goal("Y1", "Y2"),
        goal("Y2", "Y1", { equivalents: ["E1"] }),
        goal("G1", "Y1"),
      ],
      completedCodes: [],
      selected: ["E1"],
    });
    expect(result.creditedBySelection).toEqual(["Y2"]);
    expect(find(result.blocked, "G1").chain).toEqual(["Y1", "Y2"]);
  });

  it("sends an OR with an unreadable branch to toVerify, with the known branch as a hint", () => {
    const result = analyzeBlocking({
      goals: [goal("P1"), goal("A1", "P1"), goal("H1", "A1 OU ZZ99"), goal("H2", "H1")],
      completedCodes: [],
      selected: [],
    });
    expect(codes(result.toVerify)).toEqual(["H1", "H2"]);
    expect(codes(result.blocked)).toEqual(["A1"]);
    expect(find(result.blocked, "A1").dependents).toBe(0);
  });

  it("still blocks an OR whose branches are all known", () => {
    const result = analyzeBlocking({
      goals: [goal("P1"), goal("A1", "P1"), goal("D4", "P1"), goal("H1", "A1 OU D4")],
      completedCodes: [],
      selected: [],
    });
    expect(codes(result.blocked)).toContain("H1");
  });

  it("orders the chain by the branches that remain after an OR is resolved", () => {
    const result = analyzeBlocking({
      goals: [goal("C1"), goal("Z1", "A1 OU C1"), goal("A1", "Z1"), goal("G1", "A1 E Z1")],
      completedCodes: ["C1"],
      selected: [],
    });
    expect(find(result.blocked, "G1").chain).toEqual(["Z1", "A1"]);
  });

  it("analyzes 500 goals in 20 prerequisite chains quickly", () => {
    // 20 chains of depth 25. A single 500-deep chain costs ~2 s inside graph.missing (O(depth²) per call).
    const chained = Array.from({ length: 500 }, (_, i) =>
      goal(`C${i}`, i % 25 === 0 ? null : `C${i - 1}`)
    );
    const roots = chained.filter((_, i) => i % 25 === 0).map(item => item.code);
    const started = Date.now();
    const result = analyzeBlocking({
      goals: chained,
      completedCodes: [],
      selected: [...roots, ...chained.slice(1, 11).map(item => item.code)],
    });
    expect(Date.now() - started).toBeLessThan(1000);
    expect(result.unlockedLater).toHaveLength(20);
    expect(result.invalidSelected).toHaveLength(10);
    expect(result.blocked).toHaveLength(460);
  });

  it("does not send descendants of a discipline with no registered requirement to toVerify", () => {
    const chain = [
      goal("R1", null, { requirementsKnown: false }),
      goal("R2", "R1"),
      goal("R3", "R2"),
    ];
    const none = analyzeBlocking({ goals: chain, completedCodes: [], selected: [] });
    expect(none.available.map(item => item.code)).toEqual(["R1"]);
    expect(none.blocked.map(item => item.code)).toEqual(["R2", "R3"]);
    expect(none.toVerify).toEqual([]);

    const picked = analyzeBlocking({ goals: chain, completedCodes: [], selected: ["R1"] });
    expect(picked.unlockedLater.map(item => item.code)).toEqual(["R2"]);
    expect(picked.blocked.map(item => item.code)).toEqual(["R3"]);
  });

  it("sends a discipline with an unreadable corequisite to toVerify, never to available", () => {
    const coreq = goal("C1", null, {
      requirementsKnown: false,
      corequisite: { kind: "unknown", raw: "Autorização da coordenação" },
    });
    const result = analyzeBlocking({
      goals: [coreq, goal("D1", "C1"), goal("K1", null, { requirementsKnown: false })],
      completedCodes: [],
      selected: ["C1"],
    });
    expect(codes(result.toVerify)).toContain("C1");
    expect(codes(result.available)).toEqual(["K1"]);
    expect(result.invalidSelected).toEqual(["C1"]);
    expect(codes(result.unlockedLater)).toEqual([]);
  });

  it("counts only dependents that still wait on the blocked discipline", () => {
    const base = [goal("P0"), goal("A1", "P0"), goal("D1"), goal("T1", "A1 OU D1")];
    const withHistory = analyzeBlocking({ goals: base, completedCodes: ["D1"], selected: [] });
    expect(find(withHistory.blocked, "A1").dependents).toBe(0);
    const withSelection = analyzeBlocking({ goals: base, completedCodes: [], selected: ["D1"] });
    expect(codes(withSelection.unlockedLater)).toContain("T1");
    expect(find(withSelection.blocked, "A1").dependents).toBe(0);
    const open = analyzeBlocking({ goals: base, completedCodes: [], selected: [] });
    expect(find(open.blocked, "A1").dependents).toBe(1);
    const only = analyzeBlocking({
      goals: [goal("P0"), goal("A1", "P0"), goal("T1", "A1")],
      completedCodes: [],
      selected: [],
    });
    expect(find(only.blocked, "A1").dependents).toBe(1);
  });

  it("credits equivalences from a selected offer that is outside the curriculum", () => {
    const curriculum = [goal("A1", null, { equivalents: ["EXT1"] }), goal("X1", "A1")];
    const result = analyzeBlocking({ goals: curriculum, completedCodes: [], selected: ["ext1"] });
    expect(result.invalidSelected).toEqual([]);
    expect(result.creditedBySelection).toEqual(["A1"]);
    expect(codes(result.unlockedLater)).toEqual(["X1"]);
    const unavailable = analyzeBlocking({
      goals: [goal("P0"), goal("A1", "P0", { equivalents: ["EXT1"] })],
      completedCodes: [],
      selected: ["EXT1"],
    });
    expect(unavailable.invalidSelected).toEqual(["EXT1"]);
  });
});
