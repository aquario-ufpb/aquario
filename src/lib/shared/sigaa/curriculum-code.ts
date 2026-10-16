/** SIGAA may append the curriculum's effective semester to its registry code. */
export function normalizeCurriculumCode(value: string): string {
  const normalized = value.normalize("NFKC").trim().toUpperCase();
  const label = normalized.match(/^(\d{1,12})\s*[-–—]\s*20\d{2}\.[1-4]$/);
  return label?.[1] ?? normalized;
}
