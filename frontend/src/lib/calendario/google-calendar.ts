import { parseHorarioToSlots, groupConsecutiveSlots, type CalendarSlot } from "./utils";
import { DAY_NAMES, SEMESTER_END_DATE } from "./constants";
import type { ClassWithRoom } from "@/components/pages/calendario/types";

/**
 * Convert day number (2-6) to day of week (0-6) for date calculations
 * Our system: 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday
 */
const dayNumberToDayOfWeek = (day: number): number => {
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
 * Format date to Google Calendar format (YYYYMMDDTHHmmssZ)
 */
const formatDateForGoogleCalendar = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

/**
 * Generate Google Calendar URL for a single event
 */
export type GoogleCalendarEvent = {
  title: string;
  description: string;
  location: string;
  startDate: string; // ISO format
  endDate: string; // ISO format
  url: string; // Google Calendar URL
  classItem: ClassWithRoom;
  day: number;
  timeRange: string; // Human-readable time range
};

/**
 * Generate Google Calendar URLs for all selected classes
 * Creates one URL per merged consecutive slot group (similar to ICS logic)
 */
export function generateGoogleCalendarLinks(
  classes: ClassWithRoom[],
  semesterEndDate?: Date
): GoogleCalendarEvent[] {
  const events: GoogleCalendarEvent[] = [];

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

    // First, group consecutive slots by day (same as ICS)
    const mergedGroupsByDay = groupConsecutiveSlots(slots);

    // Then, group by time range across all days
    // This allows us to create one event for the same time slot on multiple days
    const timeRangeGroups = new Map<
      string,
      Array<{ startSlot: CalendarSlot; endSlot: CalendarSlot; day: number }>
    >();

    mergedGroupsByDay.forEach(({ startSlot, endSlot, day }) => {
      // Use time range as key (e.g., "07:00-08:00")
      const timeKey = `${startSlot.startTime}-${endSlot.endTime}`;
      if (!timeRangeGroups.has(timeKey)) {
        timeRangeGroups.set(timeKey, []);
      }
      timeRangeGroups.get(timeKey)?.push({ startSlot, endSlot, day });
    });

    // Create one event per unique time range, with all days combined
    timeRangeGroups.forEach(dayGroups => {
      // All groups have the same time range, so we can use the first one
      const { startSlot, endSlot } = dayGroups[0];
      const days = dayGroups.map(g => g.day).sort();

      // Get the earliest day for the start date
      const earliestDay = days[0];
      const firstOccurrence = getNextDateForDay(dayNumberToDayOfWeek(earliestDay));
      const startTime = parseTime(startSlot.startTime);
      const endTime = parseTime(endSlot.endTime);

      // Create event start and end dates
      const eventStart = new Date(firstOccurrence);
      eventStart.setHours(startTime.hour, startTime.minute, 0, 0);

      const eventEnd = new Date(firstOccurrence);
      eventEnd.setHours(endTime.hour, endTime.minute, 0, 0);

      // Format dates for Google Calendar URL (local time, no Z suffix)
      const startDateStr = formatDateForGoogleCalendar(eventStart).replace("Z", "");
      const endDateStr = formatDateForGoogleCalendar(eventEnd).replace("Z", "");

      // Build description with all class details
      const description = [
        `Código: ${classItem.codigo}`,
        `Turma: ${classItem.turma}`,
        classItem.docente ? `Docente: ${classItem.docente.trim()}` : "",
        `Departamento: ${classItem.departamento}`,
        classItem.alunos ? `Alunos: ${classItem.alunos}` : "",
      ]
        .filter(Boolean)
        .join("%0A"); // URL-encoded newline

      // Build title and location
      const title = encodeURIComponent(
        `${classItem.nome.trim()} - ${classItem.room.bloco} ${classItem.room.nome}`
      );
      const location = encodeURIComponent(`${classItem.room.bloco} ${classItem.room.nome}`);

      // Format recurrence end date (YYYYMMDD format for RRULE)
      const recurEndDate = `${finalEndDate.getFullYear()}${String(finalEndDate.getMonth() + 1).padStart(2, "0")}${String(finalEndDate.getDate()).padStart(2, "0")}`;

      // Get day abbreviations for all days (MO, TU, WE, TH, FR)
      const dayAbbrs = days
        .map(day => ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][dayNumberToDayOfWeek(day)])
        .join(",");

      // Generate Google Calendar URL with recurrence for multiple days
      // Format: recur=RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20241231
      const recurRule = `RRULE:FREQ=WEEKLY;BYDAY=${dayAbbrs};UNTIL=${recurEndDate}`;
      const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateStr}/${endDateStr}&details=${description}&location=${location}&recur=${encodeURIComponent(recurRule)}`;

      // Human-readable time range and days
      const timeRange = `${startSlot.startTime} - ${endSlot.endTime}`;
      const dayNames = days.map(day => DAY_NAMES[day] || `Dia ${day}`).join(", ");

      events.push({
        title: `${classItem.nome.trim()} - ${classItem.room.bloco} ${classItem.room.nome}`,
        description: [
          `Código: ${classItem.codigo}`,
          `Turma: ${classItem.turma}`,
          classItem.docente ? `Docente: ${classItem.docente.trim()}` : "",
          `Departamento: ${classItem.departamento}`,
          classItem.alunos ? `Alunos: ${classItem.alunos}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        location: `${classItem.room.bloco} ${classItem.room.nome}`,
        startDate: eventStart.toISOString(),
        endDate: eventEnd.toISOString(),
        url: calendarUrl,
        classItem,
        day: earliestDay, // Keep for compatibility, but we show all days in timeRange
        timeRange: `${dayNames} - ${timeRange}`,
      });
    });
  });

  return events;
}
