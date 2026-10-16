/**
 * Calendar utility functions for PAAS schedule parsing
 */

import { TIME_SLOTS_BY_PERIOD, PERIOD_BASE_INDEX, DAY_NAMES } from "./constants";

export type CalendarSlot = {
  day: number; // SIGAA: 1=Sunday, 2=Monday, ..., 7=Saturday
  timeSlot: number; // 1-18 (all time slots across M, T, N)
  startTime: string;
  endTime: string;
  period: "M" | "T" | "N";
  slotInPeriod: number;
};

/**
 * Parse horario string and convert to calendar slots
 *
 * Format: X{LETTER}Y
 * - X: Days (2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday)
 *   Can be multiple digits like "24" = Monday and Wednesday
 * - LETTER: M (Morning), T (Afternoon), N (Night)
 * - Y: Time slots (can be multiple like "23" = slots 2 and 3)
 *
 * Example: "35T23" = Tuesday and Thursday, afternoon slots 2 and 3 (14:00-16:00)
 *
 * @param horario - The horario string to parse (e.g., "35T23", "24M12")
 * @returns Array of calendar slots representing the schedule
 */
export const parseHorarioToSlots = (horario: string): CalendarSlot[] => {
  if (!horario) {
    return [];
  }

  const result: CalendarSlot[] = [];
  const seen = new Set<string>();
  const blocks = horario
    .replace(/\s*\(\d{2}\/\d{2}\/\d{4}\s*-\s*\d{2}\/\d{2}\/\d{4}\)\s*$/, "")
    .trim()
    .toUpperCase()
    .split(/[\s,;]+/);
  for (const block of blocks) {
    const match = block.match(/^([1-7]+)([MTN])([1-6]+)$/);
    // Never silently export just the valid portion of an unknown schedule.
    if (!match) {
      return [];
    }
    const [, daysStr, period, slotsStr] = match;
    for (const day of daysStr.split("").map(Number)) {
      for (const slotNum of slotsStr.split("").map(Number)) {
        const slotIndex = slotNum - 1; // Convert 1-based to 0-based
        const timeSlot = TIME_SLOTS_BY_PERIOD[period as "M" | "T" | "N"][slotIndex];
        if (!timeSlot) {
          return [];
        }
        const key = `${day}-${period}-${slotNum}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({
            day,
            timeSlot: PERIOD_BASE_INDEX[period as "M" | "T" | "N"] + slotIndex + 1, // 1-based for display
            startTime: timeSlot.start,
            endTime: timeSlot.end,
            period: period as "M" | "T" | "N",
            slotInPeriod: slotNum,
          });
        }
      }
    }
  }

  return result;
};

/**
 * Format horario string to human-readable format
 *
 * @param horario - The horario string to format
 * @returns Human-readable schedule description
 */
export const formatHorario = (horario: string): string => {
  if (!horario) {
    return "Não especificado";
  }

  const slots = parseHorarioToSlots(horario);
  if (slots.length === 0) {
    return horario;
  }
  return groupConsecutiveSlots(slots)
    .sort((a, b) => a.day - b.day || a.startSlot.timeSlot - b.startSlot.timeSlot)
    .map(
      ({ day, startSlot, endSlot }) => `${DAY_NAMES[day]} ${startSlot.startTime}–${endSlot.endTime}`
    )
    .join(" · ");
};

/**
 * Group consecutive slots for the same class on the same day
 * Used for merging consecutive time slots into single events
 */
export const groupConsecutiveSlots = (
  slots: CalendarSlot[]
): Array<{
  startSlot: CalendarSlot;
  endSlot: CalendarSlot;
  day: number;
}> => {
  // Group slots by day
  const slotsByDay = new Map<number, CalendarSlot[]>();
  slots.forEach(slot => {
    if (!slotsByDay.has(slot.day)) {
      slotsByDay.set(slot.day, []);
    }
    const daySlots = slotsByDay.get(slot.day);
    if (daySlots) {
      daySlots.push(slot);
    }
  });

  const mergedGroups: Array<{
    startSlot: CalendarSlot;
    endSlot: CalendarSlot;
    day: number;
  }> = [];

  slotsByDay.forEach((daySlots, day) => {
    // Sort slots by timeSlot index
    daySlots.sort((a, b) => a.timeSlot - b.timeSlot);

    // Group consecutive slots
    let i = 0;
    while (i < daySlots.length) {
      const startSlot = daySlots[i];
      let endSlot = startSlot;
      let j = i + 1;

      // Find consecutive slots
      while (
        j < daySlots.length &&
        daySlots[j].timeSlot === endSlot.timeSlot + 1 &&
        daySlots[j].startTime === endSlot.endTime
      ) {
        endSlot = daySlots[j];
        j++;
      }

      mergedGroups.push({ startSlot, endSlot, day });
      i = j;
    }
  });

  return mergedGroups;
};
