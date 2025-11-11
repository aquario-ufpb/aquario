/**
 * Calendar constants for PAAS schedule visualization
 */

export const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] as const;

export const DAY_NUMBERS = [2, 3, 4, 5, 6] as const;

export const DAY_NAMES: Record<number, string> = {
  2: "Segunda",
  3: "Terça",
  4: "Quarta",
  5: "Quinta",
  6: "Sexta",
  7: "Sábado",
} as const;

export const PERIOD_NAMES: Record<string, string> = {
  M: "Manhã",
  T: "Tarde",
  N: "Noite",
} as const;

/**
 * Time slot definitions for each period
 * M (Morning): 07:00-13:00 (6 slots, 1 hour each)
 * T (Afternoon): 13:00-19:00 (6 slots, 1 hour each)
 * N (Night): 19:00-22:20 (4 slots, 50 minutes each)
 */
export const TIME_SLOTS_BY_PERIOD: Record<
  "M" | "T" | "N",
  Array<{ start: string; end: string }>
> = {
  M: [
    { start: "07:00", end: "08:00" },
    { start: "08:00", end: "09:00" },
    { start: "09:00", end: "10:00" },
    { start: "10:00", end: "11:00" },
    { start: "11:00", end: "12:00" },
    { start: "12:00", end: "13:00" },
  ],
  T: [
    { start: "13:00", end: "14:00" },
    { start: "14:00", end: "15:00" },
    { start: "15:00", end: "16:00" },
    { start: "16:00", end: "17:00" },
    { start: "17:00", end: "18:00" },
    { start: "18:00", end: "19:00" },
  ],
  N: [
    { start: "19:00", end: "19:50" },
    { start: "19:50", end: "20:40" },
    { start: "20:40", end: "21:30" },
    { start: "21:30", end: "22:20" },
  ],
} as const;

/**
 * Base index for each period in the combined time slot array
 * M: 0-5, T: 6-11, N: 12-15
 */
export const PERIOD_BASE_INDEX: Record<"M" | "T" | "N", number> = {
  M: 0,
  T: 6,
  N: 12,
} as const;

/**
 * Calendar time slots for display in the grid
 * Combines all periods into a single array with labels
 */
export const CALENDAR_TIME_SLOTS = [
  // Morning (M)
  { label: "07:00-08:00", period: "M" as const, slot: 1, index: 1 },
  { label: "08:00-09:00", period: "M" as const, slot: 2, index: 2 },
  { label: "09:00-10:00", period: "M" as const, slot: 3, index: 3 },
  { label: "10:00-11:00", period: "M" as const, slot: 4, index: 4 },
  { label: "11:00-12:00", period: "M" as const, slot: 5, index: 5 },
  { label: "12:00-13:00", period: "M" as const, slot: 6, index: 6 },
  // Afternoon (T)
  { label: "13:00-14:00", period: "T" as const, slot: 1, index: 7 },
  { label: "14:00-15:00", period: "T" as const, slot: 2, index: 8 },
  { label: "15:00-16:00", period: "T" as const, slot: 3, index: 9 },
  { label: "16:00-17:00", period: "T" as const, slot: 4, index: 10 },
  { label: "17:00-18:00", period: "T" as const, slot: 5, index: 11 },
  { label: "18:00-19:00", period: "T" as const, slot: 6, index: 12 },
  // Night (N)
  { label: "19:00-19:50", period: "N" as const, slot: 1, index: 13 },
  { label: "19:50-20:40", period: "N" as const, slot: 2, index: 14 },
  { label: "20:40-21:30", period: "N" as const, slot: 3, index: 15 },
  { label: "21:30-22:20", period: "N" as const, slot: 4, index: 16 },
] as const;

/**
 * Color palette for class visualization in the calendar
 */
export const CLASS_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
] as const;

/**
 * Semester dates - Update these for each new semester
 * Format: Year, Month (0-indexed), Day
 */
export const SEMESTER_END_DATE = new Date(2026, 3, 10); // April 10, 2026

// For second semester, uncomment and update:
// export const SEMESTER_END_DATE = new Date(2025, 11, 31); // December 31, 2025
