/**
 * Calendar utility functions for PAAS schedule parsing
 */

import { TIME_SLOTS_BY_PERIOD, PERIOD_BASE_INDEX, DAY_NAMES, PERIOD_NAMES } from "./constants";

export type CalendarSlot = {
  day: number; // 2-6 (Monday-Friday)
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
 * Example: "35T23" = Wednesday (3), Afternoon (T), slots 2 and 3 (14:00-16:00)
 *
 * @param horario - The horario string to parse (e.g., "35T23", "24M12")
 * @returns Array of calendar slots representing the schedule
 */
export const parseHorarioToSlots = (horario: string): CalendarSlot[] => {
  if (!horario) {
    return [];
  }

  const match = horario.match(/^(\d+)([MTN])(\d+)$/);
  if (!match) {
    return [];
  }

  const [, daysStr, period, slotsStr] = match;
  const days = daysStr.split("").map(Number); // e.g., "24" -> [2, 4]
  const slotNumbers = slotsStr.split("").map(Number); // e.g., "23" -> [2, 3]

  const result: CalendarSlot[] = [];

  days.forEach(day => {
    slotNumbers.forEach(slotNum => {
      const slotIndex = slotNum - 1; // Convert 1-based to 0-based
      const timeSlot = TIME_SLOTS_BY_PERIOD[period as "M" | "T" | "N"][slotIndex];
      if (timeSlot) {
        result.push({
          day,
          timeSlot: PERIOD_BASE_INDEX[period as "M" | "T" | "N"] + slotIndex + 1, // 1-based for display
          startTime: timeSlot.start,
          endTime: timeSlot.end,
          period: period as "M" | "T" | "N",
          slotInPeriod: slotNum,
        });
      }
    });
  });

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

  const match = horario.match(/^(\d+)([MTN])(\d+)$/);
  if (!match) {
    return horario;
  }

  const [, daysStr, period, slotsStr] = match;
  const dayNumbers = daysStr.split("").map(Number);
  const days = dayNumbers.map(day => DAY_NAMES[day] || `Dia ${day}`).join(", ");
  const periodName = PERIOD_NAMES[period] || period;

  return `${days} - ${periodName} (${slotsStr})`;
};
