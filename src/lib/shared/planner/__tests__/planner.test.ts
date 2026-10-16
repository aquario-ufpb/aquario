/** @jest-environment node */
import { checkRequirement, parseRequirement } from "../requirements";
import {
  defaultSettings,
  draftSchema,
  emptyDraft,
  settingsSchema,
  type PlannerGoal,
  type PlannerInput,
  type PlannerOffer,
} from "../types";
import { fitsAvailability, meetingsFor, solvePlanner } from "../solver";
import { generatePlannerICS, plannerCalendarSeries, recifeInstant } from "../calendar-export";

const goal = (code: string, extra: Partial<PlannerGoal> = {}): PlannerGoal => ({
  code,
  name: code,
  priority: "high",
  equivalents: [],
  workload: 60,
  prerequisite: null,
  corequisite: null,
  requirementsKnown: true,
  completed: false,
  unlocks: 0,
  ...extra,
});
const offer = (
  code: string,
  schedule = "2M12",
  extra: Partial<PlannerOffer> = {}
): PlannerOffer => ({
  id: code,
  code,
  name: code,
  section: "01",
  semester: "2026.2",
  schedule,
  teacher: "",
  location: "CI",
  coordinates: null,
  source: "SIGAA",
  reservations: { "123": 10 },
  totalSeats: null,
  availableSeats: null,
  demand: null,
  observedAt: "2026-10-14T00:00:00Z",
  sourceUrl: null,
  ...extra,
});
const input = (
  goals: PlannerGoal[],
  offers: PlannerOffer[],
  extra: Partial<PlannerInput> = {}
): PlannerInput => ({
  semester: "2026.2",
  courseId: "123",
  goals,
  offers,
  windows: [],
  settings: { ...defaultSettings },
  fixedOfferIds: [],
  completedCodes: [],
  assumedPassedCodes: [],
  ...extra,
});

describe("academic rules", () => {
  it("fixes an offered component without requiring every objective that accepts its credit", () => {
    const result = solvePlanner(
      input([goal("A1", { equivalents: ["C3"] }), goal("C3")], [offer("C3")], {
        fixedOfferIds: ["C3"],
      })
    );
    expect(result.solutions.length).toBeGreaterThan(0);
    expect(
      result.solutions.every(
        solution => solution.selections.length === 1 && solution.selections[0].offer.code === "C3"
      )
    ).toBe(true);
  });
  it("preserves a fixed equivalent when only the objective it can replace is completed", () => {
    const result = solvePlanner(
      input(
        [
          goal("D1", { completed: true, equivalents: ["E1"] }),
          goal("E1", { priority: "optional" }),
          goal("B1"),
        ],
        [offer("E1"), offer("B1")],
        {
          completedCodes: ["D1"],
          fixedOfferIds: ["E1"],
          settings: { ...defaultSettings, maxClasses: 1 },
        }
      )
    );
    expect(result.solutions.length).toBeGreaterThan(0);
    expect(result.solutions.every(solution => solution.selections[0].offer.code === "E1")).toBe(
      true
    );
  });
  it("keeps unconfirmed unmet academic rules conditional rather than proving them unmet", () => {
    const data = input(
      [
        goal("A1", {
          requirementsKnown: false,
          prerequisite: parseRequirement("Z1"),
          corequisite: parseRequirement("Z2"),
        }),
      ],
      [offer("A1")],
      { settings: { ...defaultSettings, includeConditional: true } }
    );
    expect(solvePlanner(data).solutions[0].conditional.join()).toContain("requisitos a verificar");
    expect(
      solvePlanner({ ...data, settings: { ...data.settings, includeConditional: false } }).solutions
    ).toEqual([]);
    expect(
      solvePlanner({ ...data, goals: [{ ...data.goals[0], requirementsKnown: true }] }).solutions
    ).toEqual([]);
  });
  it.each([false, true])(
    "reports normalized fixed-offer reasons through equivalent goals (direct goal: %s)",
    direct => {
      const result = solvePlanner(
        input(
          [
            goal("A1", { equivalents: [" c3 "] }),
            goal("C3", { priority: direct ? "high" : "exclude" }),
          ],
          [offer(" c3 ")],
          { fixedOfferIds: [" c3 "], windows: [{ day: 1, start: 0, end: 1440, kind: "busy" }] }
        )
      );
      expect(result.blockingChoices?.find(choice => choice.kind === "fixed")?.reasons).toContain(
        "Fora da disponibilidade ou em horário bloqueado"
      );
    }
  );
  it("does not claim infeasibility when the budget ends before finding a solution", () => {
    const result = solvePlanner(
      input([goal("A1", { priority: "required" })], [offer("A1")], { fixedOfferIds: ["A1"] }),
      { maxNodes: 1, maxMs: 1000 }
    );
    expect(result.limited).toBe(true);
    expect(result.solutions).toEqual([]);
    expect(result.blockingChoices).toBeUndefined();
    expect(result.message).toContain("limite de cálculo");
    expect(result.message).not.toContain("Nenhuma combinação atende");
  });
  it.each([null, "Outro prédio", "CI"])(
    "ignores location when selecting back-to-back classes (%s)",
    location => {
      const data = input(
        [goal("A1", { priority: "required" }), goal("B2", { priority: "required" })],
        [offer("A1", "2M1"), offer("B2", "2M2", { location })]
      );
      const result = solvePlanner(data);
      expect(result.solutions).toHaveLength(1);
      expect(result.solutions[0].conditional).toEqual([]);
      expect(result.solutions[0]).not.toHaveProperty("travelUnknown");
      expect(result.solutions[0]).not.toHaveProperty("maxDistanceMeters");
      expect(result.solutions[0]).not.toHaveProperty("transfers");
    }
  );
  it("checks the offered equivalent's prerequisites even when its target has none", () => {
    const data = input(
      [goal("A1", { equivalents: ["X1"] }), goal("X1", { prerequisite: parseRequirement("Z1") })],
      [offer("X1")]
    );
    expect(solvePlanner(data).solutions).toHaveLength(0);
    const satisfied = solvePlanner({ ...data, completedCodes: ["Z1"] });
    expect(
      satisfied.solutions.some(solution =>
        solution.selections.some(item => item.goal.code === "A1")
      )
    ).toBe(true);
  });
  it("requires conditional mode when the equivalent's academic rules are missing", () => {
    const data = input([goal("A1", { equivalents: ["X1"] })], [offer("X1")]);
    expect(solvePlanner(data).solutions).toHaveLength(0);
    const result = solvePlanner({
      ...data,
      settings: { ...data.settings, includeConditional: true },
    });
    expect(result.solutions[0].conditional.join()).toContain("requisitos a verificar");
    expect(result.solutions[0].conditional.join()).toContain("carga horária a verificar");
  });
  it("checks equivalent corequisites and uses the offered workload", () => {
    const data = input(
      [
        goal("A1", { priority: "required", equivalents: ["X1"] }),
        goal("X1", {
          priority: "exclude",
          workload: 90,
          corequisite: parseRequirement("B2 OU C3"),
        }),
        goal("B2"),
      ],
      [offer("X1"), offer("B2", "3M12")]
    );
    const result = solvePlanner(data);
    expect(result.solutions[0].selections).toHaveLength(2);
    expect(result.solutions[0].workload).toBe(150);
    expect(solvePlanner({ ...data, offers: [offer("X1")] }).solutions).toHaveLength(0);
    expect(
      solvePlanner({ ...data, settings: { ...data.settings, maxWorkload: 120 } }).solutions
    ).toHaveLength(0);
  });
  it("marks approval assumptions used only by corequisites as conditional", () => {
    const data = input(
      [goal("A1", { corequisite: parseRequirement("B2 OU C3") }), goal("B2")],
      [offer("A1")],
      { assumedPassedCodes: ["B2"] }
    );
    expect(solvePlanner(data).solutions[0].conditional.join()).toContain("aprovação simulada");
    expect(solvePlanner({ ...data, completedCodes: ["C3"] }).solutions[0].conditional).toEqual([]);
  });
  it.each([
    {
      targetHours: 30,
      offeredHours: 90,
      minimum: 120,
      expectedCodes: ["A1", "B2"],
      expectedHours: 150,
    },
    { targetHours: 90, offeredHours: 30, minimum: 60, expectedCodes: ["B2"], expectedHours: 60 },
  ])(
    "prunes optional equivalents using the offered workload ($offeredHours h)",
    ({ targetHours, offeredHours, minimum, expectedCodes, expectedHours }) => {
      const data = input(
        [
          goal("A1", {
            priority: "optional",
            curricularRequired: false,
            equivalents: ["X1"],
            workload: targetHours,
          }),
          goal("X1", { priority: "exclude", workload: offeredHours }),
          goal("B2", { priority: "required" }),
        ],
        [offer("X1"), offer("B2", "3M12")],
        { settings: { ...defaultSettings, minWorkload: minimum } }
      );
      const result = solvePlanner(data);
      expect(result.solutions[0].selections.map(item => item.goal.code).sort()).toEqual(
        expectedCodes
      );
      expect(result.solutions[0].workload).toBe(expectedHours);
    }
  );
  it("does not count disabled optatives or unavailable goals against the search group limit", () => {
    const goals = [
      goal("A1", { curricularRequired: true }),
      ...Array.from({ length: 110 }, (_, i) => goal(`X${i}`, { curricularRequired: false })),
    ];
    const data = input(goals, [offer("A1"), offer("X0", "3M12")], {
      settings: { ...defaultSettings, includeOptional: false },
    });
    const result = solvePlanner(data);
    expect(result.solutions[0].selections.map(item => item.goal.code)).toEqual(["A1"]);
    expect(result.exclusions.find(item => item.code === "X0")?.reasons).toContain(
      "Optativas desativadas nesta simulação"
    );
    expect(result.exclusions.find(item => item.code === "X1")?.reasons.join()).toContain(
      "Nenhuma turma localizada"
    );
  });
  it("preserves the limit of 80 viable search groups", () => {
    const goals = Array.from({ length: 81 }, (_, i) => goal(`A${i}`));
    const result = solvePlanner(
      input(
        goals,
        goals.map(item => offer(item.code))
      )
    );
    expect(result.solutions).toHaveLength(0);
    expect(result.explored).toBe(0);
    expect(result.message).toContain("até 80 disciplinas");
  });
  it("supports AND/OR parentheses and preserves unknown institutional rules", () => {
    const rule = parseRequirement("(A1 OU B2) E C3");
    expect(checkRequirement(rule, new Set(["B2", "C3"]))).toBe("met");
    expect(checkRequirement(rule, new Set(["B2"]))).toBe("unmet");
    expect(checkRequirement(parseRequirement("75% da carga cumprida"), new Set())).toBe("unknown");
    expect(checkRequirement(parseRequirement("A1 E"), new Set(["A1"]))).toBe("unknown");
  });
  it("does not treat a concurrently selected prerequisite as completed", () => {
    const result = solvePlanner(
      input(
        [goal("A1"), goal("B2", { priority: "required", prerequisite: parseRequirement("A1") })],
        [offer("A1"), offer("B2", "3M12")]
      )
    );
    expect(result.solutions).toHaveLength(0);
    expect(result.exclusions.find(item => item.code === "B2")?.reasons.join()).toContain(
      "Pré-requisito não atendido"
    );
  });
  it("accepts selected corequisites but rejects missing ones", () => {
    const goals = [
      goal("A1", { priority: "required", corequisite: parseRequirement("B2") }),
      goal("B2"),
    ];
    const result = solvePlanner(input(goals, [offer("A1"), offer("B2", "3M12")]));
    expect(result.solutions[0].selections).toHaveLength(2);
    expect(solvePlanner(input(goals.slice(0, 1), [offer("A1")])).solutions).toHaveLength(0);
  });
  it("labels approval assumptions as conditional", () => {
    const result = solvePlanner(
      input([goal("B2", { prerequisite: parseRequirement("A1") })], [offer("B2")], {
        assumedPassedCodes: ["A1"],
      })
    );
    expect(result.solutions[0].conditional.join()).toContain("aprovação simulada");
  });
  it("does not silently accept unknown requirements", () => {
    const base = input([goal("A1", { requirementsKnown: false })], [offer("A1")]);
    expect(solvePlanner(base).solutions).toHaveLength(0);
    expect(
      solvePlanner({
        ...base,
        settings: { ...base.settings, includeConditional: true },
      }).solutions[0].conditional.join()
    ).toContain("requisitos a verificar");
  });
});

describe("availability and optimization", () => {
  it("uses chosen workload limits and flags differences from the SIGAA reference", () => {
    const base = input([goal("A1")], [offer("A1")], {
      institutionalWorkload: { minimum: 90, maximum: 120 },
    });
    expect(solvePlanner(base).solutions[0].conditional.join()).toContain("abaixo do mínimo");
    expect(
      solvePlanner({
        ...base,
        institutionalWorkload: { minimum: null, maximum: 30 },
      }).solutions[0].conditional.join()
    ).toContain("acima do máximo");
  });
  it("merges available windows, with occupied/unavailable taking precedence", () => {
    const windows = [
      { day: 1, start: 420, end: 480, kind: "available" as const },
      { day: 1, start: 480, end: 540, kind: "available" as const },
    ];
    expect(fitsAvailability({ day: 1, start: 420, end: 540 }, windows, "available")).toBe(true);
    expect(
      fitsAvailability(
        { day: 1, start: 420, end: 540 },
        [...windows, { day: 1, start: 470, end: 490, kind: "busy" }],
        "available"
      )
    ).toBe(false);
    expect(fitsAvailability({ day: 2, start: 420, end: 480 }, windows, "available")).toBe(false);
  });
  it("chooses a nonoverlapping combination and keeps every meeting of a turma", () => {
    const result = solvePlanner(
      input(
        [goal("A1", { priority: "required" }), goal("B2", { priority: "required" })],
        [
          offer("A1", "24M12"),
          offer("B2", "4M12"),
          offer("B2", "3M12", { id: "B2-alt", section: "02" }),
        ]
      )
    );
    expect(result.solutions[0].selections.map(item => item.offer.id)).toContain("B2-alt");
  });
  it("prioritizes the student's reservations and does not infer free seats", () => {
    const base = input(
      [goal("A1")],
      [
        offer("A1", "2M12", { id: "other", reservations: { "456": 30 } }),
        offer("A1", "3M12", { id: "own" }),
      ]
    );
    expect(solvePlanner(base).solutions[0].selections[0].offer.id).toBe("own");
    expect(
      solvePlanner({
        ...base,
        settings: { ...base.settings, reservationMode: "only" },
      }).solutions.every(solution => solution.reserved === 1)
    ).toBe(true);
    expect(
      solvePlanner({ ...base, settings: { ...base.settings, onlyAvailableSeats: true } }).solutions
    ).toHaveLength(0);
  });
  it("does not sacrifice a high-priority chair solely to increase reservations", () => {
    const base = input(
      [goal("A1"), goal("B2", { priority: "optional" })],
      [offer("A1", "2M12", { reservations: {} }), offer("B2", "2M12")]
    );
    expect(solvePlanner(base).solutions[0].selections[0].goal.code).toBe("A1");
  });
  it("uses only explicit equivalents, with no duplicate selection of one offered component", () => {
    const base = input(
      [
        goal("A1", { equivalents: ["C3"], priority: "required" }),
        goal("B2", { equivalents: ["C3"], priority: "required" }),
        goal("C3", { priority: "exclude" }),
      ],
      [offer("C3")]
    );
    expect(solvePlanner(base).solutions).toHaveLength(0);
    expect(
      solvePlanner({ ...base, goals: [base.goals[0], base.goals[2]] }).solutions[0].selections[0]
        .offer.code
    ).toBe("C3");
    expect(
      solvePlanner({
        ...base,
        goals: [base.goals[0], base.goals[2]],
        settings: { ...base.settings, allowEquivalents: false },
      }).solutions
    ).toHaveLength(0);
  });
  it("does not prune a gap that a subsequent required class fills", () => {
    const base = input(
      [
        goal("A1", { priority: "required" }),
        goal("B2", { priority: "required" }),
        goal("C3", { priority: "required" }),
      ],
      [offer("A1", "2M1"), offer("B2", "2M3"), offer("C3", "2M2")]
    );
    expect(
      solvePlanner({ ...base, settings: { ...base.settings, maxGapMinutes: 0 } }).solutions[0]
        .gapMinutes
    ).toBe(0);
  });
  it("reports impossible fixed offers and preserves limits", () => {
    const base = input([goal("A1"), goal("B2")], [offer("A1"), offer("B2")], {
      fixedOfferIds: ["A1", "B2"],
    });
    expect(solvePlanner(base).solutions).toHaveLength(0);
    expect(solvePlanner({ ...base, fixedOfferIds: ["missing"] }).message).toContain("fixada");
  });
  it("gives the same scores and alternatives regardless of locations or coordinates", () => {
    const base = input(
      [goal("A1", { priority: "required" }), goal("B2", { priority: "required" })],
      [
        offer("A1", "2M1", { location: "CI", coordinates: { lat: -7, lng: -34 } }),
        offer("B2", "2M2", {
          id: "far",
          location: "Outro campus",
          coordinates: { lat: 40, lng: 100 },
        }),
        offer("B2", "2M2", { id: "near", location: "CI", coordinates: { lat: -7, lng: -34 } }),
      ]
    );
    const result = solvePlanner(base);
    const withoutLocations = solvePlanner({
      ...base,
      offers: base.offers.map(item => ({ ...item, location: null, coordinates: null })),
    });
    const summary = (value: ReturnType<typeof solvePlanner>) =>
      value.solutions.map(solution => ({
        id: solution.id,
        score: solution.score,
        conditional: solution.conditional,
      }));
    expect(summary(result)).toEqual(summary(withoutLocations));
    expect(result.solutions).toHaveLength(2);
  });
  it("loads old scenarios while ignoring retired location constraints and travel mode", () => {
    const base = input(
      [goal("A1", { priority: "required" }), goal("B2", { priority: "required" })],
      [offer("A1", "2M1", { location: null }), offer("B2", "2M2", { location: "Other campus" })]
    );
    const legacyDraft = {
      ...emptyDraft("2026.2"),
      offers: base.offers,
      settings: {
        ...base.settings,
        mode: "travel",
        transferMinutes: 240,
        maxDistanceMeters: 0,
        requireLocations: true,
      },
    };
    const parsed = draftSchema.parse(legacyDraft);
    expect(parsed.settings).toEqual(defaultSettings);
    expect(legacyDraft.settings.mode).toBe("travel");
    const result = solvePlanner({ ...base, settings: parsed.settings });
    expect(result.solutions).toHaveLength(1);
    expect(result.solutions[0].conditional).toEqual([]);
    expect(settingsSchema.safeParse({ ...defaultSettings, unexpectedSetting: true }).success).toBe(
      false
    );
  });
  it("returns distinct alternatives and declares search limits", () => {
    const base = input(
      [goal("A1")],
      [
        offer("A1", "2M1", { id: "a" }),
        offer("A1", "3M1", { id: "b" }),
        offer("A1", "4M1", { id: "c" }),
      ]
    );
    expect(new Set(solvePlanner(base).solutions.map(solution => solution.id)).size).toBe(3);
    expect(solvePlanner(base, { maxNodes: 1, maxMs: 1000 }).limited).toBe(true);
  });
});

describe("recurring calendar", () => {
  it("converts Recife wall time independently of the browser timezone", () => {
    expect(recifeInstant("2026-10-14", 480).toISOString()).toBe("2026-10-14T11:00:00.000Z");
  });
  it("uses the first chronological occurrence and does not exceed semester dates", () => {
    const events = plannerCalendarSeries([offer("A1", "24M12")], "2026-10-14", "2026-10-16");
    expect(events).toHaveLength(1);
    expect(events[0].start.toISOString().slice(0, 10)).toBe("2026-10-14");
    expect(events[0].googleUrl).toContain("ctz=America%2FRecife");
  });
  it("keeps stable UIDs and escapes/folds ICS text", () => {
    const offers = [offer("A1", "7N12", { name: "Programação; vírgula, e acentuação ".repeat(8) })];
    const first = generatePlannerICS(offers, "2026-10-01", "2026-12-31");
    expect(first).toContain("BYDAY=SA");
    expect(first).toContain("\\;");
    expect(first.match(/UID:[^\r]+/g)).toEqual(
      generatePlannerICS(offers, "2026-10-01", "2026-12-31").match(/UID:[^\r]+/g)
    );
    expect(first.split("\r\n").every(line => new TextEncoder().encode(line).length <= 75)).toBe(
      true
    );
  });
});

test("ordered priorities prefer the first requested discipline over two lower choices", () => {
  const result = solvePlanner(
    input(
      [goal("A"), goal("B"), goal("C")],
      [offer("A", "2M12 3M12"), offer("B", "2M12"), offer("C", "3M12")],
      { priorityOrder: ["A", "B", "C"] }
    )
  );
  expect(result.solutions[0].selections.map(item => item.goal.code)).toEqual(["A"]);
  const reordered = solvePlanner(
    input(
      [goal("A"), goal("B"), goal("C")],
      [offer("A", "2M12 3M12"), offer("B", "2M12"), offer("C", "3M12")],
      { priorityOrder: ["B", "C", "A"] }
    )
  );
  expect(reordered.solutions[0].selections.map(item => item.goal.code).sort()).toEqual(["B", "C"]);
});
test("ignoring impediments keeps marked windows but allows those class times", () => {
  const data = input([goal("A")], [offer("A")], {
    windows: [{ day: 1, start: 0, end: 1440, kind: "busy" }],
    settings: { ...defaultSettings, respectAvailability: false },
  });
  expect(solvePlanner(data).solutions).toHaveLength(1);
  expect(
    solvePlanner({ ...data, settings: { ...data.settings, respectAvailability: true } }).solutions
  ).toHaveLength(0);
});

test("SIGAA teaching periods include Sunday and 50-minute night classes", () => {
  expect(meetingsFor("1N1")).toEqual([{ day: 0, start: 1140, end: 1190 }]);
  expect(meetingsFor("2M6 7T6 3N4")).toEqual(
    expect.arrayContaining([
      { day: 1, start: 720, end: 780 },
      { day: 6, start: 1080, end: 1140 },
      { day: 2, start: 1290, end: 1340 },
    ])
  );
  const data = input([goal("A")], [offer("A", "1N1")], {
    windows: [{ day: 0, start: 1140, end: 1190, kind: "unavailable" }],
  });
  expect(solvePlanner(data).solutions).toHaveLength(0);
  expect(
    solvePlanner({ ...data, windows: [{ day: 0, start: 1190, end: 1240, kind: "unavailable" }] })
      .solutions
  ).toHaveLength(1);
});

test("simulated EDO and Electronics I are not suggested again, even required or pinned", () => {
  const goals = [
    goal("1103180", { name: "Séries e EDO", priority: "required" }),
    goal("GDSCO0026", { name: "Eletrônica Aplicada I", priority: "required" }),
    goal("GDSCO0027", {
      name: "Eletrônica Aplicada II",
      prerequisite: parseRequirement("GDSCO0026"),
    }),
  ];
  const offers = [offer("1103180"), offer("GDSCO0026", "3M12"), offer("GDSCO0027", "4M12")];
  const result = solvePlanner(
    input(goals, offers, {
      assumedPassedCodes: ["1103180", "GDSCO0026"],
      fixedOfferIds: ["1103180", "GDSCO0026"],
    })
  );
  expect(result.solutions[0].selections.map(item => item.goal.code)).toEqual(["GDSCO0027"]);
  expect(result.solutions[0].conditional.join()).toContain("aprovação simulada");
  expect(result.exclusions.map(item => item.code)).not.toContain("1103180");
  const original = solvePlanner(input(goals, offers));
  expect(original.solutions[0].selections.map(item => item.goal.code).sort()).toEqual([
    "1103180",
    "GDSCO0026",
  ]);
  expect(goals.every(goal => !goal.completed)).toBe(true);
});
test("completed codes are excluded even if a goal still says pending", () => {
  const result = solvePlanner(
    input([goal("A1"), goal("B2")], [offer("A1"), offer("B2", "3M12")], { completedCodes: ["a1"] })
  );
  expect(result.solutions[0].selections.map(item => item.goal.code)).toEqual(["B2"]);
});

test("electives complete the minimum but do not fill an already sufficient required schedule", () => {
  const goals = [
    goal("A1", { curricularRequired: true, priority: "optional" }),
    goal("B2", { curricularRequired: false, priority: "optional" }),
  ];
  const offers = [offer("A1"), offer("B2", "3M12")];
  const first = solvePlanner(input(goals, offers));
  expect(first.solutions[0].selections.map(item => item.goal.code)).toEqual(["A1"]);
  const minimumTwo = solvePlanner(
    input(goals, offers, { settings: { ...defaultSettings, minClasses: 2 } })
  );
  expect(minimumTwo.solutions[0].selections).toHaveLength(2);
  expect(
    solvePlanner(
      input(goals, offers, {
        settings: { ...defaultSettings, minClasses: 2, includeOptional: false },
      })
    ).solutions
  ).toHaveLength(0);
});
test("course offering membership is different from a positive reservation", () => {
  const data = input([goal("A1")], [offer("A1", "2M12", { reservations: { "123": 0 } })], {
    settings: { ...defaultSettings, offerScope: "course" },
  });
  expect(solvePlanner(data).solutions).toHaveLength(1);
  expect(
    solvePlanner({ ...data, settings: { ...data.settings, reservationMode: "only" } }).solutions
  ).toHaveLength(0);
  const alternative = { ...data, offers: [offer("A1", "2M12", { reservations: { "456": 10 } })] };
  expect(solvePlanner(alternative).solutions).toHaveLength(0);
  expect(
    solvePlanner({
      ...alternative,
      settings: { ...alternative.settings, offerScope: "curriculum" },
    }).solutions
  ).toHaveLength(1);
});
test("one hour of gaps and a chosen one-hour workload minimum do not enforce a hidden 240h minimum", () => {
  const data = input(
    [goal("A1", { curricularRequired: true }), goal("B2", { curricularRequired: true })],
    [offer("A1"), offer("B2", "3M12")],
    {
      windows: [
        { day: 1, start: 420, end: 780, kind: "available" },
        { day: 2, start: 420, end: 780, kind: "available" },
      ],
      settings: {
        ...defaultSettings,
        availabilityMode: "available",
        minClasses: 1,
        minWorkload: 1,
        maxGapMinutes: 60,
      },
      institutionalWorkload: { minimum: 240, maximum: 480 },
    }
  );
  expect(solvePlanner(data).solutions[0].workload).toBe(120);
  expect(solvePlanner(data).solutions[0].conditional.join()).toContain("240h");
  const tooSmall = solvePlanner({ ...data, settings: { ...data.settings, maxWorkload: 1 } });
  expect(tooSmall.message).toContain("carga máxima configurada é 1h");
});

test("excluding one section preserves other sections of the same discipline", () => {
  const result = solvePlanner(
    input([goal("A1")], [offer("A1"), offer("A1", "3M12", { id: "A1-02", section: "02" })], {
      excludedOfferIds: ["A1"],
    })
  );
  expect(result.solutions.length).toBeGreaterThan(0);
  expect(
    result.solutions.every(item => item.selections.every(selection => selection.offer.id !== "A1"))
  ).toBe(true);
  expect(result.solutions[0].selections[0].offer.id).toBe("A1-02");
});

test("omitted disciplines retain readable names and codes", () => {
  const result = solvePlanner(
    input([goal("A1"), goal("B2", { name: "Equações diferenciais" })], [offer("A1")])
  );
  expect(result.solutions[0].omitted).toContainEqual({
    code: "B2",
    name: "Equações diferenciais",
    reason: "filters",
  });
});

test("unmet prerequisites show known names and preserve unknown codes and logical operators", () => {
  const result = solvePlanner(
    input(
      [
        goal("A1", { name: "Cálculo I", priority: "exclude" }),
        goal("B2", {
          name: "Equações diferenciais",
          prerequisite: parseRequirement("A1 E (X9 OU Y8)"),
        }),
      ],
      [offer("B2")]
    )
  );
  expect(result.exclusions.find(item => item.code === "B2")?.reasons).toContain(
    "Pré-requisito não atendido: (Cálculo I (A1) e (X9 ou Y8))"
  );
});

test("lists an unavailable required discipline by name and code", () => {
  const result = solvePlanner(input([goal("A1", { name: "Cálculo I", priority: "required" })], []));
  expect(result.message).toContain("Cálculo I (A1)");
  expect(result.blockingChoices).toEqual([
    expect.objectContaining({ kind: "required", code: "A1", name: "Cálculo I" }),
  ]);
});

test("lists a fixed section blocked by availability so it can be unpinned", () => {
  const result = solvePlanner(
    input([goal("A1")], [offer("A1", "2M12", { name: "Cálculo I", section: "06" })], {
      fixedOfferIds: ["A1"],
      windows: [{ day: 1, start: 420, end: 780, kind: "busy" }],
    })
  );
  expect(result.blockingChoices).toEqual([
    expect.objectContaining({
      kind: "fixed",
      code: "A1",
      name: "Cálculo I",
      offerId: "A1",
      section: "06",
    }),
  ]);
  expect(result.message).toContain("turma 06");
});

test("offers unpin actions for conflicting fixed sections even when each is individually viable", () => {
  const result = solvePlanner(
    input([goal("A1"), goal("B2")], [offer("A1"), offer("B2")], { fixedOfferIds: ["A1", "B2"] })
  );
  expect(result.solutions).toEqual([]);
  expect(result.blockingChoices?.map(item => item.offerId)).toEqual(["A1", "B2"]);
});
