/** @jest-environment node */
import { groupPlannerExclusions } from "../exclusion-groups";
import type { PlannerResult } from "../types";

const result = (exclusions: PlannerResult["exclusions"]): PlannerResult => ({
  solutions: [],
  exclusions,
  limited: false,
  explored: 0,
  message: "",
});

test("groups prerequisite failures together and keeps each requirement readable", () => {
  const grouped = groupPlannerExclusions(
    result([
      { code: "B2", name: "EDO", reasons: ["Pré-requisito não atendido: Cálculo I (A1)"] },
      {
        code: "C3",
        name: "Eletrônica II",
        reasons: ["Pré-requisito não atendido: Eletrônica I (E1)"],
      },
    ])
  );
  expect(grouped).toHaveLength(1);
  expect(grouped[0].reason).toBe("Pré-requisito não atendido");
  expect(grouped[0].items.map(item => item.detail)).toEqual([
    "Cálculo I (A1)",
    "Eletrônica I (E1)",
  ]);
});

test("keeps viable omissions distinct from rejected alternatives and removes generic duplicates", () => {
  const grouped = groupPlannerExclusions(
    result([
      { code: "A1", name: "Cálculo I", reasons: ["Fora da disponibilidade"] },
      { code: "B2", name: "EDO", reasons: ["Fora da disponibilidade"] },
    ]),
    {
      omitted: [
        { code: "A1", name: "Cálculo I", reason: "filters" },
        { code: "B2", name: "EDO", reason: "combination" },
      ],
    }
  );
  expect(grouped.map(group => group.reason)).toEqual([
    "Fora da disponibilidade",
    "Fora desta opção por limites, conflitos ou prioridades",
  ]);
  expect(grouped[1].items.map(item => item.code)).toEqual(["B2"]);
});

test("retains rejected alternatives even when a discipline has a selected section", () => {
  const grouped = groupPlannerExclusions(
    result([
      {
        code: "A1",
        name: "Cálculo I",
        reasons: ["Turma excluída por você", "Turma excluída por você"],
      },
    ]),
    { omitted: [] }
  );
  expect(grouped[0].items).toHaveLength(1);
  expect(grouped[0].items[0].name).toBe("Cálculo I");
});
