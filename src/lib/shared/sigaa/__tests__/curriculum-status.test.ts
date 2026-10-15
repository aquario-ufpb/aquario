import { curriculumStatus } from "../curriculum-status";
import type { GradeDisciplinaNode } from "@/lib/shared/types/curriculo.types";
import type { SigaaAcademicComponent } from "@/lib/shared/types/sigaa-academic";

const discipline = (code: string): GradeDisciplinaNode => ({
  id: `node-${code}`,
  disciplinaId: `local-${code}`,
  codigo: code,
  nome: code,
  periodo: 1,
  natureza: "OBRIGATORIA",
  cargaHorariaTotal: 60,
  cargaHorariaTeoria: 60,
  cargaHorariaPratica: 0,
  departamento: null,
  modalidade: null,
  ementa: null,
  preRequisitos: [],
  equivalencias: [],
});
const component = (
  code: string,
  status: SigaaAcademicComponent["status"]
): SigaaAcademicComponent => ({
  code,
  name: code,
  integrationType: "DISCIPLINA",
  period: 1,
  workloadHours: 60,
  required: true,
  status,
  prerequisite: null,
  corequisite: null,
});
const grade = [discipline("A1"), discipline("B2"), discipline("C3")];

it("maps imported completed/enrolled codes to local grade ids even with empty manual records", () => {
  const result = curriculumStatus(
    grade,
    [],
    [],
    [component(" a1 ", "completed"), component("Ｂ2", "enrolled")]
  );
  expect([...result.completedIds]).toEqual(["local-A1"]);
  expect([...result.enrolledIds]).toEqual(["local-B2"]);
});
it("gives imported status priority over conflicting manual markings", () => {
  const result = curriculumStatus(
    grade,
    ["local-B2"],
    ["local-A1"],
    [component("A1", "completed"), component("B2", "enrolled")]
  );
  expect([...result.completedIds]).toEqual(["local-A1"]);
  expect([...result.enrolledIds]).toEqual(["local-B2"]);
});
it.each(["pending", "unknown"] as const)(
  "does not keep stale manual completion when SIGAA says %s",
  status => {
    const result = curriculumStatus(
      grade,
      ["local-A1"],
      ["local-B2"],
      [component("A1", status), component("B2", status)]
    );
    expect(result.completedIds.size).toBe(0);
    expect(result.enrolledIds.size).toBe(0);
  }
);
it("retains manual statuses for codes absent from SIGAA", () => {
  const result = curriculumStatus(grade, ["local-A1"], ["local-B2"], []);
  expect(result.completedIds.has("local-A1")).toBe(true);
  expect(result.enrolledIds.has("local-B2")).toBe(true);
});
it("reports missing imported disciplines without applying a fuzzy or equivalent match", () => {
  const result = curriculumStatus(
    [{ ...grade[0], equivalencias: ["ALT1"] }],
    [],
    [],
    [component("ALT1", "completed"), component("EXTRA2", "enrolled"), component("NOT3", "pending")]
  );
  expect(result.completedIds.size).toBe(0);
  expect(result.missing.map(item => item.code)).toEqual(["ALT1", "EXTRA2"]);
});
it("reflects the new snapshot without changing manual data or the old result", () => {
  const manual = ["local-A1"];
  const before = curriculumStatus(grade, manual, [], [component("A1", "enrolled")]);
  const after = curriculumStatus(grade, manual, [], [component("A1", "completed")]);
  expect(before.enrolledIds.has("local-A1")).toBe(true);
  expect(after.completedIds.has("local-A1")).toBe(true);
  expect(after.enrolledIds.size).toBe(0);
  expect(manual).toEqual(["local-A1"]);
});
