import { calendarScheduleKey } from "@/lib/shared/calendario/room-binding";
import type { SigaaAcademicSnapshotPayload } from "@/lib/shared/types/sigaa-academic";
import type { DisciplinaSemestreResponse } from "@/lib/shared/types/disciplina-semestre.types";
import type { ClassWithRoom } from "@/components/pages/calendario/types";
import { projectSigaaEnrollments } from "../project-sigaa-enrollments";

const snapshot: SigaaAcademicSnapshotPayload = {
  identity: {
    matricula: "20260000001",
    sourceCourse: "Engenharia da Computação",
    sourceSemester: "2026.2",
  },
  curriculum: {
    code: "492016",
    maximumCompletionTerm: null,
    semesterWorkload: { minimum: null, maximum: null },
    cra: { value: null, source: "unavailable" },
    progress: [],
    components: [
      {
        code: "EDO1",
        name: "Séries e EDO",
        integrationType: "DISCIPLINA",
        period: 4,
        workloadHours: 60,
        required: true,
        status: "enrolled",
        prerequisite: null,
        corequisite: null,
      },
    ],
  },
  grades: [],
  classes: [
    {
      sourceKey: "123456",
      code: "EDO1",
      name: "Séries e EDO",
      scheduleRaw: "35T12",
      room: "Outro centro / 201",
      semester: "2026.2",
    },
  ],
};
const manual: DisciplinaSemestreResponse = {
  id: "manual",
  disciplinaId: "edo",
  disciplinaCodigo: "EDO1",
  disciplinaNome: "EDO",
  turma: "07",
  horario: "35T12",
  docente: "",
  codigoPaas: 12,
  criadoEm: "2026-10-15T00:00:00Z",
};
const allocation: ClassWithRoom = {
  id: 12,
  codigo: "EDO1",
  nome: "EDO",
  turma: "07",
  horario: "35T12",
  docente: "",
  departamento: "",
  alunos: "",
  preferencias: [],
  pcd: 0,
  preAlocacao: null,
  paasRoomSolutionId: 1,
  room: { bloco: "CI", nome: "106" },
};
const project = (
  payload = snapshot,
  saved: DisciplinaSemestreResponse[] = [],
  rooms: ClassWithRoom[] = [],
  roomSemester = "2026.2"
) => projectSigaaEnrollments(payload, "2026.2", saved, rooms, roomSemester);

it("projects imported schedules without requiring manual enrollment or pretending a source id is a section", () => {
  const before = JSON.stringify(snapshot);
  const result = project();
  expect(result.enrollments).toHaveLength(1);
  expect(result.enrollments[0].section).toBeNull();
  expect(result.classes[0].horario).toBe("35T12");
  expect(result.classes[0].turma).toBe("A confirmar");
  expect(result.classes[0].room.nome).toContain("SIGAA · a confirmar");
  expect(result.codes.has("EDO1")).toBe(true);
  expect(JSON.stringify(snapshot)).toBe(before);
});
it("does not assign a same-code/same-time SACI room without an explicit saved association", () => {
  const result = project(snapshot, [], [allocation]);
  expect(result.enrollments[0].roomSource).toBe("SIGAA");
  expect(result.classes[0].room.nome).toContain("Outro centro");
});
it("uses an explicit saved SACI association only when semester, code and timetable agree", () => {
  expect(project(snapshot, [manual], [allocation]).enrollments[0]).toMatchObject({
    room: "CI 106",
    roomSource: "SACI",
    section: "07",
  });
  expect(project(snapshot, [manual], [allocation], "2026.1").enrollments[0].roomSource).toBe(
    "SIGAA"
  );
  expect(
    project(snapshot, [{ ...manual, horario: "2M12" }], [allocation]).enrollments[0].roomSource
  ).toBe("SIGAA");
  expect(
    project(snapshot, [{ ...manual, codigoPaas: null }], [allocation]).enrollments[0].roomSource
  ).toBe("SIGAA");
});
it("does not import historical classes or infer the semester when both sources are missing", () => {
  const result = project({
    ...snapshot,
    identity: { ...snapshot.identity, sourceSemester: "2026.1" },
    classes: [{ ...snapshot.classes[0], semester: "2026.1" }],
  });
  expect(result.enrollments).toEqual([]);
  expect(result.outdated).toBe(true);
  expect(
    project({
      ...snapshot,
      identity: { ...snapshot.identity, sourceSemester: null },
      classes: [{ ...snapshot.classes[0], semester: null }],
    }).enrollments
  ).toEqual([]);
});
it("keeps unknown schedules and enrolled components visible as pending without inventing calendar events", () => {
  const unknown = project({
    ...snapshot,
    classes: [{ ...snapshot.classes[0], scheduleRaw: "A definir" }],
  });
  expect(unknown.enrollments).toHaveLength(1);
  expect(unknown.classes).toEqual([]);
  expect(unknown.pending[0].reason).toContain("Horário");
  const missing = project({ ...snapshot, classes: [] });
  expect(missing.enrollments[0].code).toBe("EDO1");
  expect(missing.classes).toEqual([]);
});
it("keeps multiple sections of the same code distinct, including an extraordinary schedule", () => {
  const result = project({
    ...snapshot,
    classes: [
      ...snapshot.classes,
      { ...snapshot.classes[0], sourceKey: "external", scheduleRaw: "2N12" },
    ],
  });
  expect(result.enrollments).toHaveLength(2);
  expect(new Set(result.classes.map(item => item.id)).size).toBe(2);
  expect(result.classes.map(item => item.horario)).toEqual(["35T12", "2N12"]);
});
it("applies an explicit room preference without creating a manual enrollment and drops it if the timetable changes", () => {
  const binding = {
    semester: "2026.2",
    sourceKey: "123456",
    allocationId: 12,
    code: "EDO1",
    scheduleKey: calendarScheduleKey("35T12"),
    centerId: "CI",
    section: "07",
  };
  const chosen = projectSigaaEnrollments(
    snapshot,
    "2026.2",
    [],
    [allocation],
    "2026.2",
    [binding],
    "CI"
  );
  expect(chosen.enrollments[0]).toMatchObject({
    room: "CI 106",
    roomSource: "SACI",
    hasRoomBinding: true,
  });
  const changed = projectSigaaEnrollments(
    { ...snapshot, classes: [{ ...snapshot.classes[0], scheduleRaw: "2T34" }] },
    "2026.2",
    [],
    [allocation],
    "2026.2",
    [binding],
    "CI"
  );
  expect(changed.enrollments[0]).toMatchObject({
    room: "Outro centro / 201",
    roomSource: "SIGAA",
    bindingOutdated: true,
  });
});
