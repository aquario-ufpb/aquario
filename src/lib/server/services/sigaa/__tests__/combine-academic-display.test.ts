import {
  collectManualAcademicComponents,
  combineAcademicDisplay,
} from "../combine-academic-display";

const sigaaComponent = (
  code: string,
  status: "completed" | "enrolled" | "pending" | "unknown"
) => ({
  code,
  name: `SIGAA ${code}`,
  integrationType: "DISCIPLINA",
  period: 1,
  workloadHours: 60,
  required: true,
  status,
  prerequisite: null,
  corequisite: null,
});

describe("combineAcademicDisplay", () => {
  it.each(["completed", "enrolled", "pending", "unknown"] as const)(
    "uses SIGAA presentation for %s while retaining a conflicting manual value",
    status => {
      const manual = [
        { disciplinaId: "disc-1", code: "gdco0001", name: "Manual", state: "completed" as const },
      ];
      const result = combineAcademicDisplay({
        catalog: [{ disciplinaId: "disc-1", code: "GDCO0001", name: "Catálogo" }],
        manual,
        sigaa: [sigaaComponent("GDCO0001", status)],
      });

      expect(result[0]).toMatchObject({
        code: "GDCO0001",
        manual: manual[0],
        presentation: { origin: "SIGAA", state: status, name: "SIGAA GDCO0001" },
      });
      expect(manual).toEqual([
        { disciplinaId: "disc-1", code: "gdco0001", name: "Manual", state: "completed" },
      ]);
    }
  );

  it("keeps a SIGAA-only component visible without inventing a catalog match", () => {
    expect(
      combineAcademicDisplay({
        catalog: [],
        manual: [],
        sigaa: [sigaaComponent("LIVRE0001", "unknown")],
      })
    ).toEqual([
      expect.objectContaining({
        code: "LIVRE0001",
        catalog: null,
        presentation: { origin: "SIGAA", state: "unknown", name: "SIGAA LIVRE0001" },
      }),
    ]);
  });

  it("uses manual presentation only when SIGAA has no value for the code", () => {
    expect(
      combineAcademicDisplay({
        catalog: [{ disciplinaId: "disc-1", code: "GDCO0001", name: "Catálogo" }],
        manual: [{ disciplinaId: "disc-1", code: "GDCO0001", name: "Catálogo", state: "enrolled" }],
        sigaa: [],
      })[0].presentation
    ).toEqual({ origin: "MANUAL", state: "enrolled", name: "Catálogo" });
  });

  it("normalizes source codes without mutating or duplicating the source values", () => {
    const manual = [
      { disciplinaId: "disc-1", code: " gdco0001 ", name: "Manual", state: "completed" as const },
    ];
    const result = combineAcademicDisplay({
      catalog: [{ disciplinaId: "disc-1", code: "GDCO0001", name: "Catálogo" }],
      manual,
      sigaa: [],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      code: "GDCO0001",
      presentation: { origin: "MANUAL", state: "completed" },
    });
    expect(manual).toEqual([
      { disciplinaId: "disc-1", code: " gdco0001 ", name: "Manual", state: "completed" },
    ]);
  });

  it("keeps completed precedence when enrolled data uses a different code shape", () => {
    expect(
      collectManualAcademicComponents({
        catalog: [{ disciplinaId: "disc-1", code: " GDCO0001 ", name: "Catálogo" }],
        completed: [{ disciplinaId: "disc-1", code: "GDCO0001", name: "Catálogo" }],
        enrolled: [{ disciplinaId: "disc-1", code: "gdco0001", name: "Catálogo" }],
      })
    ).toEqual([{ disciplinaId: "disc-1", code: "GDCO0001", name: "Catálogo", state: "completed" }]);
  });

  it("keeps a completed discipline from a previous course visible by its stored identity", () => {
    const manual = collectManualAcademicComponents({
      catalog: [{ disciplinaId: "current", code: "EC0001", name: "Circuitos" }],
      completed: [{ disciplinaId: "previous", code: "CC0001", name: "Algoritmos antigos" }],
      enrolled: [],
    });

    expect(combineAcademicDisplay({ catalog: [], manual, sigaa: [] })).toEqual([
      expect.objectContaining({
        code: "CC0001",
        catalog: null,
        presentation: { origin: "MANUAL", state: "completed", name: "Algoritmos antigos" },
      }),
    ]);
  });

  it("keeps an enrolled discipline from a previous course visible by its stored name", () => {
    const manual = collectManualAcademicComponents({
      catalog: [{ disciplinaId: "current", code: "EC0001", name: "Circuitos" }],
      completed: [],
      enrolled: [{ disciplinaId: "previous", code: "CC0002", name: "Estruturas de dados antigas" }],
    });

    expect(combineAcademicDisplay({ catalog: [], manual, sigaa: [] })).toEqual([
      expect.objectContaining({
        code: "CC0002",
        catalog: null,
        presentation: {
          origin: "MANUAL",
          state: "enrolled",
          name: "Estruturas de dados antigas",
        },
      }),
    ]);
  });
});
