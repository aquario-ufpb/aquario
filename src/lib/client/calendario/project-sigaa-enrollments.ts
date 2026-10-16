import {
  calendarScheduleKey,
  resolveRoomBinding,
  type CalendarRoomBinding,
} from "@/lib/shared/calendario/room-binding";
import type { SigaaAcademicSnapshotPayload } from "@/lib/shared/types/sigaa-academic";
import type { DisciplinaSemestreResponse } from "@/lib/shared/types/disciplina-semestre.types";
import type { ClassWithRoom } from "@/components/pages/calendario/types";
import { normalizeAcademicCode } from "@/lib/shared/sigaa/combine-academic-display";
import { resolveEnrolledClasses, type CalendarPendingItem } from "./resolve-enrolled-classes";

export type ImportedEnrollment = {
  id: string;
  sourceKey: string | null;
  hasRoomBinding: boolean;
  bindingOutdated: boolean;
  code: string | null;
  name: string;
  schedule: string | null;
  room: string | null;
  roomSource: "SIGAA" | "SACI" | null;
  section: string | null;
};
const scheduleKey = calendarScheduleKey;

/** Read-only projection: imported classes never become manual enrollment records. */
export function projectSigaaEnrollments(
  snapshot: SigaaAcademicSnapshotPayload | null,
  semester: string | undefined,
  manual: readonly DisciplinaSemestreResponse[],
  allocations: readonly ClassWithRoom[],
  allocationSemester: string | undefined,
  bindings: readonly CalendarRoomBinding[] = [],
  centerId = "CI"
): {
  enrollments: ImportedEnrollment[];
  classes: ClassWithRoom[];
  pending: CalendarPendingItem[];
  codes: Set<string>;
  outdated: boolean;
} {
  const result: ReturnType<typeof projectSigaaEnrollments> = {
    enrollments: [],
    classes: [],
    pending: [],
    codes: new Set(),
    outdated: false,
  };
  if (!snapshot || !semester) {
    return result;
  }
  const sourceSemester = snapshot.identity.sourceSemester;
  result.outdated = !!sourceSemester && sourceSemester !== semester;
  const currentClasses = snapshot.classes.filter(
    item => (item.semester ?? sourceSemester) === semester
  );
  const entries = currentClasses.map(item => ({
    id: `sigaa:${item.sourceKey}`,
    sourceKey: item.sourceKey as string | null,
    code: item.code,
    name: item.name,
    schedule: item.scheduleRaw,
    room: item.room,
  }));
  // Also show enrolled components when the upstream class list lacks timetable details.
  if (sourceSemester === semester) {
    for (const component of snapshot.curriculum.components) {
      if (
        component.status === "enrolled" &&
        !entries.some(
          item =>
            item.code && normalizeAcademicCode(item.code) === normalizeAcademicCode(component.code)
        )
      ) {
        entries.push({
          id: `sigaa:component:${component.code}`,
          sourceKey: null as string | null,
          code: component.code,
          name: component.name,
          schedule: null,
          room: null,
        });
      }
    }
  }
  for (const [index, item] of entries.entries()) {
    const code = item.code ? normalizeAcademicCode(item.code) : null;
    const row: ImportedEnrollment = {
      ...item,
      code,
      hasRoomBinding: false,
      bindingOutdated: false,
      section: null,
      roomSource: item.room ? "SIGAA" : null,
    };
    const key = scheduleKey(item.schedule);
    // Only an explicit saved association can supply a section/SACI room. A SIGAA
    // sourceKey is an internal class id, never a section number or PAAS id.
    const saved =
      code && key && allocationSemester === semester
        ? manual.filter(
            candidate =>
              normalizeAcademicCode(candidate.disciplinaCodigo) === code &&
              scheduleKey(candidate.horario) === key &&
              candidate.codigoPaas !== null
          )
        : [];
    if (saved.length === 1) {
      const resolved = resolveEnrolledClasses(saved, allocations, true).classes;
      const match =
        resolved.length === 1 && resolved[0].id > 0 && scheduleKey(resolved[0].horario) === key
          ? resolved[0]
          : null;
      if (match) {
        row.section = match.turma;
        row.room = [match.room.bloco, match.room.nome].filter(Boolean).join(" ") || null;
        row.roomSource = row.room ? "SACI" : null;
      }
    }
    const binding = bindings.find(
      binding => binding.sourceKey === item.sourceKey && binding.semester === semester
    );
    if (binding) {
      row.hasRoomBinding = true;
      const selected =
        allocationSemester === semester
          ? resolveRoomBinding(binding, code, item.schedule, semester, centerId, allocations)
          : null;
      if (selected && selected.room.nome.trim()) {
        row.section = selected.turma;
        row.room = [selected.room.bloco, selected.room.nome].filter(Boolean).join(" ");
        row.roomSource = "SACI";
      } else {
        row.section = null;
        row.room = item.room;
        row.roomSource = item.room ? "SIGAA" : null;
        row.bindingOutdated = true;
      }
    }
    result.enrollments.push(row);
    if (key) {
      if (code) {
        result.codes.add(code);
      }
      result.classes.push({
        id: -(10000 + index),
        codigo: code ?? "",
        nome: item.name,
        turma: row.section ?? "A confirmar",
        horario: item.schedule ?? "",
        docente: "",
        departamento: "",
        alunos: "",
        preferencias: [],
        pcd: 0,
        preAlocacao: null,
        paasRoomSolutionId: 0,
        room: {
          bloco: "",
          nome: row.room
            ? `${row.room}${row.roomSource === "SIGAA" ? " (SIGAA · a confirmar)" : ""}`
            : "Sala a confirmar",
        },
      });
    }
    const reasons = [
      row.bindingOutdated
        ? "A escolha de sala anterior não corresponde à oferta ou horário atual; confira no SACI."
        : null,
      !key ? "Horário não informado ou não reconhecido no SIGAA." : null,
      row.roomSource !== "SACI"
        ? row.room
          ? "Sala informada pelo SIGAA; ainda não conferida no SACI."
          : "Sala a confirmar."
        : null,
    ].filter(Boolean);
    if (reasons.length) {
      result.pending.push({ disciplineId: row.id, name: row.name, reason: reasons.join(" ") });
    }
  }
  return result;
}
