import { createEvents, EventAttributes } from "ics";
import { parseHorarioToSlots, groupConsecutiveSlots } from "./utils";
import { SEMESTER_END_DATE } from "./constants";
import type { ClassWithRoom } from "@/components/pages/calendario/types";

/**
 * Convert day number (2-6) to day of week (0-6) for ICS format
 * ICS uses: 0=Sunday, 1=Monday, 2=Tuesday, etc.
 * Our system: 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday
 */
const dayNumberToICS = (day: number): number => {
  // 2 (Monday) -> 1, 3 (Tuesday) -> 2, etc.
  return day - 1;
};

/**
 * Get the next occurrence of a given day of week
 * Returns a date for the next Monday-Friday
 */
const getNextDateForDay = (dayOfWeek: number): Date => {
  const today = new Date();
  const currentDay = today.getDay(); // 0=Sunday, 1=Monday, etc.
  const targetDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert Sunday to 7 for easier math
  const currentDayAdjusted = currentDay === 0 ? 7 : currentDay;

  let daysUntilTarget = targetDay - currentDayAdjusted;
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7; // Next week
  }

  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysUntilTarget);
  return targetDate;
};

/**
 * Convert time string (HH:MM) to hours and minutes
 */
const parseTime = (timeStr: string): { hour: number; minute: number } => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hour: hours || 0, minute: minutes || 0 };
};

/**
 * Generate ICS file from selected classes
 * Creates recurring weekly events for the semester
 * Merges consecutive time slots for the same class into single events
 */
export function generateICSFile(
  classes: ClassWithRoom[],
  _semesterStartDate?: Date,
  semesterEndDate?: Date
): Promise<Blob> {
  const events: EventAttributes[] = [];

  // Use semester end date from constants, or provided date, or fallback to 4 months from now
  const finalEndDate =
    semesterEndDate ||
    SEMESTER_END_DATE ||
    (() => {
      const fallback = new Date();
      fallback.setMonth(fallback.getMonth() + 4);
      return fallback;
    })();

  classes.forEach(classItem => {
    const slots = parseHorarioToSlots(classItem.horario);

    // Group consecutive slots for this class
    const mergedGroups = groupConsecutiveSlots(slots);

    mergedGroups.forEach(({ startSlot, endSlot, day }) => {
      // Get the first occurrence of this day
      const firstOccurrence = getNextDateForDay(dayNumberToICS(day));
      const startTime = parseTime(startSlot.startTime);
      const endTime = parseTime(endSlot.endTime);

      // Create event date
      const eventDate: [number, number, number] = [
        firstOccurrence.getFullYear(),
        firstOccurrence.getMonth() + 1, // ICS uses 1-based months
        firstOccurrence.getDate(),
      ];

      const eventStart: [number, number, number, number, number] = [
        eventDate[0],
        eventDate[1],
        eventDate[2],
        startTime.hour,
        startTime.minute,
      ];

      const eventEnd: [number, number, number, number, number] = [
        eventDate[0],
        eventDate[1],
        eventDate[2],
        endTime.hour,
        endTime.minute,
      ];

      // Build description with all class details (use actual newlines)
      const description = [
        `Código: ${classItem.codigo}`,
        `Turma: ${classItem.turma}`,
        classItem.docente ? `Docente: ${classItem.docente.trim()}` : "",
        `Departamento: ${classItem.departamento}`,
        classItem.alunos ? `Alunos: ${classItem.alunos}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const event: EventAttributes = {
        title: `${classItem.nome.trim()} - ${classItem.room.bloco} ${classItem.room.nome}`,
        description: description,
        location: `${classItem.room.bloco} ${classItem.room.nome}`,
        start: eventStart,
        end: eventEnd,
        recurrenceRule: `FREQ=WEEKLY;BYDAY=${["SU", "MO", "TU", "WE", "TH", "FR", "SA"][dayNumberToICS(day)]};UNTIL=${finalEndDate.getFullYear()}${String(finalEndDate.getMonth() + 1).padStart(2, "0")}${String(finalEndDate.getDate()).padStart(2, "0")}T235959Z`,
        status: "CONFIRMED",
        busyStatus: "BUSY",
      };

      events.push(event);
    });
  });

  // Generate ICS file
  return new Promise((resolve, reject) => {
    createEvents(events, (error, value) => {
      if (error) {
        reject(new Error(`Erro ao gerar arquivo de calendário: ${error.message}`));
        return;
      }

      if (!value) {
        reject(new Error("Falha ao gerar arquivo de calendário"));
        return;
      }

      // Convert to Blob
      const blob = new Blob([value], { type: "text/calendar;charset=utf-8" });
      resolve(blob);
    });
  });
}

/**
 * Download ICS file
 */
export function downloadICSFile(blob: Blob, filename: string = "calendario.ics"): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
