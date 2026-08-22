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
      const manual = [{ code: "gdco0001", state: "completed" as const }];
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
      expect(manual).toEqual([{ code: "gdco0001", state: "completed" }]);
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
        manual: [{ code: "GDCO0001", state: "enrolled" }],
        sigaa: [],
      })[0].presentation
    ).toEqual({ origin: "MANUAL", state: "enrolled", name: "Catálogo" });
  });

  it("normalizes source codes without mutating or duplicating the source values", () => {
    const manual = [{ code: " gdco0001 ", state: "completed" as const }];
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
    expect(manual).toEqual([{ code: " gdco0001 ", state: "completed" }]);
  });

  it("keeps completed precedence when enrolled data uses a different code shape", () => {
    expect(
      collectManualAcademicComponents({
        catalog: [{ disciplinaId: "disc-1", code: " GDCO0001 ", name: "Catálogo" }],
        completedDisciplineIds: ["disc-1"],
        enrolled: [{ disciplinaId: "disc-1", code: "gdco0001" }],
      })
    ).toEqual([{ code: "GDCO0001", state: "completed" }]);
  });
});
