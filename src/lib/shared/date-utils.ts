/**
 * Extracts YYYY-MM-DD from an ISO date string without timezone conversion.
 * Dates in the DB are stored as midnight UTC, so splitting on "T" preserves
 * the intended date regardless of the user's local timezone.
 */
export function toDateInputValue(isoString: string): string {
  return isoString.split("T")[0];
}

/**
 * Formats an ISO date string as "mmm yyyy" (e.g. "jan 2026") in Portuguese,
 * extracting month/year directly from the string to avoid timezone drift.
 */
export function formatMonthYear(isoString: string): string {
  const [year, month] = isoString.split("T")[0].split("-");
  const months = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

/**
 * Returns today's date as YYYY-MM-DD in the user's local timezone.
 * Used for default values in date inputs where "today" means the user's local date.
 */
export function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
