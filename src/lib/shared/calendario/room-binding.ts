import { z } from "zod";
import { parseHorarioToSlots } from "./utils";
import { normalizeAcademicCode } from "../sigaa/combine-academic-display";

export const calendarSemesterSchema = z.string().regex(/^20\d{2}\.[1-4]$/);
export const roomBindingRequestSchema = z
  .object({
    semester: calendarSemesterSchema,
    sourceKey: z.string().min(1).max(64),
    allocationId: z.number().int().positive().max(2147483647),
  })
  .strict();
export const roomBindingSchema = roomBindingRequestSchema
  .extend({
    code: z.string().min(1).max(64),
    scheduleKey: z.string().min(1).max(2048),
    centerId: z.string().regex(/^[A-Z0-9_-]{1,20}$/),
    section: z.string().min(1).max(64),
  })
  .strict();
export type CalendarRoomBinding = z.infer<typeof roomBindingSchema>;
export type CalendarRoomBindingRequest = z.infer<typeof roomBindingRequestSchema>;
export type RoomCandidate = {
  id: number;
  codigo: string;
  turma: string;
  horario: string;
  room: { bloco: string; nome: string };
};
export const calendarScheduleKey = (value: string | null) =>
  parseHorarioToSlots(value ?? "")
    .map(slot => `${slot.day}:${slot.timeSlot}`)
    .sort()
    .join(",");

export function roomCandidates(
  code: string | null,
  schedule: string | null,
  allocations: readonly RoomCandidate[]
): RoomCandidate[] {
  const key = calendarScheduleKey(schedule);
  return code && key
    ? allocations.filter(
        item =>
          item.codigo
            .split("/")
            .some(part => normalizeAcademicCode(part) === normalizeAcademicCode(code)) &&
          calendarScheduleKey(item.horario) === key
      )
    : [];
}
export function resolveRoomBinding(
  binding: CalendarRoomBinding,
  code: string | null,
  schedule: string | null,
  semester: string,
  centerId: string,
  allocations: readonly RoomCandidate[]
) {
  if (
    !code ||
    binding.semester !== semester ||
    binding.centerId !== centerId ||
    normalizeAcademicCode(binding.code) !== normalizeAcademicCode(code) ||
    binding.scheduleKey !== calendarScheduleKey(schedule)
  ) {
    return null;
  }
  const matches = roomCandidates(code, schedule, allocations).filter(
    item => item.turma.trim() === binding.section.trim()
  );
  const exact = matches.filter(item => item.id === binding.allocationId);
  return exact.length === 1 ? exact[0] : null;
}
