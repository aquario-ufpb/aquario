import { buildAcademicContext } from "../academic-context";
import type { GradeCurricularResponse, GradeDisciplinaNode } from "../../types/curriculo.types";
import type {
  SigaaAcademicComponent,
  SigaaAcademicSnapshotPayload,
} from "../../types/sigaa-academic";
import { checkRequirement } from "../requirements";

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
const withComponent = (
  payload: SigaaAcademicSnapshotPayload,
  changes: Partial<SigaaAcademicComponent>,
  extraCode?: string
): SigaaAcademicSnapshotPayload => ({
  ...payload,
  curriculum: {
    ...payload.curriculum,
    components: [
      { ...payload.curriculum.components[0], ...changes },
      ...(extraCode ? [{ ...payload.curriculum.components[0], ...changes, code: extraCode }] : []),
    ],
  },
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

it.each([null, "", "   "])("falls back to catalog prerequisites for empty SIGAA text %p", text => {
  const imported = withComponent(snapshot(), { prerequisite: text });
  const local = { ...grade, disciplinas: [{ ...discipline("A1"), preRequisitos: [" B2 "] }] };
  const context = buildAcademicContext(local, imported, []);
  expect(context.goals[0].requirementsKnown).toBe(true);
  expect(checkRequirement(context.goals[0].prerequisite, new Set())).toBe("unmet");
  expect(checkRequirement(context.goals[0].prerequisite, new Set(["B2"]))).toBe("met");
});

it("uses known local prerequisite lists even without a SIGAA component", () => {
  const local = { ...grade, disciplinas: [{ ...discipline("B2"), preRequisitos: ["C3"] }] };
  const context = buildAcademicContext(local, snapshot(), ["C3"]);
  expect(context.goals[0].requirementsKnown).toBe(true);
  expect(checkRequirement(context.goals[0].prerequisite, new Set(context.completedCodes))).toBe(
    "met"
  );
});

it("keeps unreadable SIGAA expressions unknown instead of replacing them with simpler local rules", () => {
  const imported = withComponent(snapshot(), { prerequisite: "Autorização da coordenação" });
  const local = { ...grade, disciplinas: [{ ...discipline("A1"), preRequisitos: ["B2"] }] };
  const context = buildAcademicContext(local, imported, ["B2"]);
  expect(context.goals[0].requirementsKnown).toBe(false);
  expect(context.goals[0].prerequisite?.kind).toBe("unknown");
});

it("keeps prerequisites unknown when neither source provides information", () => {
  const imported = withComponent(snapshot(), { prerequisite: null });
  expect(buildAcademicContext(grade, imported, []).goals[0].requirementsKnown).toBe(false);
});

it("preserves manual completion for unknown imported states, including snapshot-only goals", () => {
  const imported = withComponent(snapshot(), { status: "unknown" }, "X9");
  const context = buildAcademicContext(grade, imported, ["A1", "X9"]);
  expect(context.completedCodes).toEqual(expect.arrayContaining(["A1", "X9"]));
  expect(
    context.goals.filter(goal => ["A1", "X9"].includes(goal.code)).every(goal => goal.completed)
  ).toBe(true);
});

it.each(["pending", "enrolled"] as const)(
  "does not expand equivalence over explicit imported %s",
  status => {
    const imported = withComponent(snapshot(), { status });
    const context = buildAcademicContext(grade, imported, ["B2"]);
    expect(context.completedCodes).not.toContain("A1");
    expect(context.goals[0].completed).toBe(false);
  }
);

it("takes only status from another curriculum for a catalog goal", () => {
  const imported = withComponent(
    snapshot("2010"),
    {
      status: "completed",
      name: "Old curriculum name",
      required: true,
      period: 9,
      workloadHours: 120,
      prerequisite: "C3",
      corequisite: "D4",
    },
    "X9"
  );
  const local = {
    ...grade,
    disciplinas: [{ ...discipline("A1"), natureza: "OPTATIVA" as const, preRequisitos: ["B2"] }],
  };
  const context = buildAcademicContext(local, imported, []);
  expect(context.goals[0]).toMatchObject({
    name: "A1",
    curricularRequired: false,
    period: 1,
    workload: 60,
    prerequisite: { kind: "all", items: [{ kind: "code", code: "B2" }] },
    corequisite: null,
    requirementsKnown: false,
    completed: true,
  });
  expect(context.goals.find(goal => goal.code === "X9")?.requirementsKnown).toBe(false);
});
