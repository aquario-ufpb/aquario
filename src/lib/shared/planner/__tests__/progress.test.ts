/** @jest-environment node */
import { createProgressPlanner } from "../progress";
import { parseRequirement } from "../requirements";
import { solvePlanner } from "../solver";
import {
  defaultSettings,
  draftSchema,
  emptyDraft,
  type PlannerGoal,
  type PlannerOffer,
  type PlannerSettings,
} from "../types";
const goal = (
  code: string,
  prerequisite: string | null = null,
  extra: Partial<PlannerGoal> = {}
): PlannerGoal => ({
  code,
  name: code === "R3" ? "Robótica" : code,
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
const offer = (code: string): PlannerOffer => ({
  id: code,
  code,
  name: code,
  section: "01",
  semester: "2026.2",
  schedule: "2M12",
  teacher: "",
  location: null,
  coordinates: null,
  source: "SIGAA",
  reservations: { "123": 10 },
  totalSeats: null,
  availableSeats: null,
  demand: null,
  observedAt: "2026-10-15T00:00:00Z",
  sourceUrl: null,
});
const goals = [goal("A0"), goal("Z1"), goal("B2", "Z1"), goal("C4"), goal("R3", "B2 E C4")];
const settings: PlannerSettings = {
  ...defaultSettings,
  progressStrategy: "target",
  progressTarget: "R3",
  maxClasses: 1,
};
const solve = (extra: Partial<PlannerSettings> = {}, priorityOrder: string[] = []) =>
  solvePlanner({
    semester: "2026.2",
    courseId: "123",
    settings: { ...settings, ...extra },
    goals,
    offers: [offer("A0"), offer("Z1"), offer("B2")],
    windows: [],
    fixedOfferIds: [],
    completedCodes: [],
    assumedPassedCodes: [],
    priorityOrder,
  });

test("recommends the first step of a multi-stage target path instead of an unrelated discipline", () => {
  const result = solve();
  expect(result.solutions[0].selections.map(item => item.goal.code)).toEqual(["Z1"]);
  expect(result.solutions[0].progress?.paths).toContainEqual([
    { code: "Z1", name: "Z1" },
    { code: "B2", name: "B2" },
    { code: "R3", name: "Robótica" },
  ]);
  expect(
    result.solutions.every(solution => solution.selections.every(item => item.goal.code !== "B2"))
  ).toBe(true);
  expect(result.solutions[0].progress?.remaining.map(item => item.code)).toEqual(["B2", "C4"]);
});
test("manual priority order takes precedence over the target graph", () => {
  expect(solve({}, ["A0"]).solutions[0].selections[0].goal.code).toBe("A0");
});
test("AND prerequisites need all branches; OR permits one branch", () => {
  const graph = createProgressPlanner(
    [goal("A1"), goal("B2"), goal("C3", "A1 E B2"), goal("D4", "A1 OU B2")],
    new Set(),
    { ...settings, progressStrategy: "unlock" }
  );
  expect(graph.evaluate(["A1"]).progress.unlocked.map(item => item.code)).toEqual(["D4"]);
  expect(graph.evaluate(["A1", "B2"]).progress.unlocked.map(item => item.code)).toEqual([
    "C3",
    "D4",
  ]);
});
test("global opening strategy works with imported prerequisites even without local unlock counters", () => {
  expect(
    solve({ progressStrategy: "unlock", progressTarget: null }).solutions[0].selections[0].goal.code
  ).toBe("Z1");
});
test("target progress stops counting already approved parts of the chain", () => {
  const graph = createProgressPlanner(goals, new Set(["Z1", "C4"]), settings);
  const result = graph.evaluate(["B2"]);
  expect(result.progress.remaining).toEqual([]);
  expect(result.progress.unlocked.map(item => item.code)).toContain("R3");
});
test("cycles and unknown requirements never receive target progress credit", () => {
  for (const candidates of [
    [goal("R3", "B2"), goal("B2", "R3")],
    [goal("R3", "B2"), goal("B2", null, { requirementsKnown: false })],
  ]) {
    const result = createProgressPlanner(candidates, new Set(), settings).evaluate(["B2"]);
    expect(result.score).toEqual([0, 0]);
    expect(result.progress.warnings.join()).toMatch(/desconhecidos ou cíclicos/);
  }
});
test("a redundant OR branch adds no target progress bonus", () => {
  const graph = createProgressPlanner(
    [goal("A1"), goal("B2"), goal("R3", "A1 OU B2")],
    new Set(),
    settings
  );
  expect(graph.evaluate(["A1"]).score).toEqual(graph.evaluate(["A1", "B2"]).score);
  expect(graph.evaluate(["A1"]).progress.remaining).toEqual([]);
});
test("an unknown OR branch is not invented as an easier known path", () => {
  const graph = createProgressPlanner([goal("A1"), goal("R3", "A1 OU X9")], new Set(), settings);
  expect(graph.evaluate(["A1"]).progress.warnings).toEqual([]);
  expect(graph.evaluate(["A1"]).score).toEqual([0, 1]);
});
test("older saved scenarios keep balanced ordering", () => {
  const draft = emptyDraft("2026.2");
  const { progressStrategy: _strategy, progressTarget: _target, ...oldSettings } = draft.settings;
  const restored = draftSchema.parse({ ...draft, settings: oldSettings });
  expect(restored.settings.progressStrategy).toBe("balanced");
  expect(restored.settings.progressTarget).toBeNull();
});

test("simulated approval moves the target plan forward without suggesting the current discipline again", () => {
  const result = solvePlanner({
    semester: "2026.2",
    courseId: "123",
    settings,
    goals,
    offers: [offer("Z1"), offer("B2")],
    windows: [],
    fixedOfferIds: [],
    completedCodes: [],
    assumedPassedCodes: ["Z1"],
  });
  expect(result.solutions[0].selections.map(item => item.goal.code)).toEqual(["B2"]);
  expect(result.solutions[0].progress?.paths[0].map(item => item.code)).toEqual(["B2", "R3"]);
  expect(result.solutions[0].conditional.join()).toContain("aprovação simulada");
});

test("does not favor an unnecessary OR route when another branch is already complete", () => {
  const graph = createProgressPlanner(
    [goal("A1"), goal("B2"), goal("R3", "A1 OU B2")],
    new Set(["A1"]),
    settings
  );
  const projection = graph.evaluate(["B2"]);
  expect(projection.score).toEqual([0, 0]);
  expect(projection.progress.paths).toEqual([]);
});
