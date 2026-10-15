import { buildAcademicContext } from "../academic-context";
import type { GradeCurricularResponse, GradeDisciplinaNode } from "../../types/curriculo.types";
import type { SigaaAcademicSnapshotPayload } from "../../types/sigaa-academic";

const discipline = (code: string, equivalents: string[] = []): GradeDisciplinaNode => ({
  id: code,
  disciplinaId: code,
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
  equivalencias: equivalents,
});
const grade: GradeCurricularResponse = {
  curriculoId: "c",
  curriculoCodigo: "2024",
  cursoId: "course",
  cursoNome: "Course",
  disciplinas: [discipline("A1", ["B2"]), discipline("B2", ["C3"])],
};
const snapshot = (code = "2024"): SigaaAcademicSnapshotPayload => ({
  identity: { matricula: "20260000001", sourceCourse: "Course", sourceSemester: "2026.2" },
  curriculum: {
    code,
    maximumCompletionTerm: null,
    semesterWorkload: { minimum: null, maximum: null },
    cra: { value: null, source: "unavailable" },
    progress: [],
    components: [
      {
        code: "A1",
        name: "A1",
        integrationType: "DISCIPLINA",
        period: 1,
        workloadHours: 60,
        required: true,
        status: "pending",
        prerequisite: "B2 OU C3",
        corequisite: null,
      },
    ],
  },
  grades: [],
  classes: [],
});
it("uses the SIGAA state over a stale manual completion and keeps its requirement expression", () => {
  const context = buildAcademicContext(grade, snapshot(), ["A1"]);
  expect(context.completedCodes).not.toContain("A1");
  expect(context.goals[0].prerequisite?.kind).toBe("any");
  expect(context.goals[0].requirementsKnown).toBe(true);
});
it("does not apply equivalents from a different curriculum", () => {
  const context = buildAcademicContext(grade, snapshot("2010"), ["B2"]);
  expect(context.goals[0].equivalents).toEqual([]);
  expect(context.goals[0].requirementsKnown).toBe(false);
});
it("does not infer a transitive equivalence or treat the local catalog as complete rules", () => {
  const context = buildAcademicContext(grade, null, ["C3"]);
  expect(context.completedCodes).toContain("B2");
  expect(context.completedCodes).not.toContain("A1");
  expect(context.goals[0].requirementsKnown).toBe(false);
  expect(context.goals[0].prerequisite).toBeNull();
});

it("preserves level zero and unknown periods from SIGAA and the local curriculum", () => {
  const imported = snapshot();
  const payload = {
    ...imported,
    curriculum: {
      ...imported.curriculum,
      components: [
        { ...imported.curriculum.components[0], period: 0 },
        { ...imported.curriculum.components[0], code: "X0", period: null },
      ],
    },
  };
  const context = buildAcademicContext(grade, payload, []);
  expect(context.goals.find(goal => goal.code === "A1")?.period).toBe(0);
  expect(context.goals.find(goal => goal.code === "B2")?.period).toBe(1);
  expect(context.goals.find(goal => goal.code === "X0")?.period).toBeNull();
});

it("matches SIGAA curriculum labels with the semester suffix to the exact catalog code", () => {
  const context = buildAcademicContext(grade, snapshot("2024 - 2026.2"), []);
  expect(context.curriculumMatched).toBe(true);
  expect(context.goals[0].requirementsKnown).toBe(true);
  expect(context.goals[0].equivalents).toEqual(["B2"]);
  expect(buildAcademicContext(grade, snapshot("2010 - 2026.2"), []).curriculumMatched).toBe(false);
});
