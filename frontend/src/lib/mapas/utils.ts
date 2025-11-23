/**
 * Utility functions for the Maps feature
 */

/**
 * Extract first name from a full name
 * Handles cases like "José Antonio" -> "José", "GLedson Elias" -> "GLedson"
 */
function getFirstName(fullName: string): string {
  return fullName.split(" ")[0];
}

/**
 * Format professors list for display (first names only)
 * Returns formatted string like "Ruy, Mardson e Henrique"
 */
export function formatProfessorsForDisplay(professors: string[]): string {
  if (professors.length === 0) {
    return "";
  }
  if (professors.length === 1) {
    return getFirstName(professors[0]);
  }
  if (professors.length === 2) {
    return `${getFirstName(professors[0])} e ${getFirstName(professors[1])}`;
  }
  // 3 or more: "Name1, Name2 e Name3"
  const firstNames = professors.slice(0, -1).map(getFirstName);
  const lastName = getFirstName(professors[professors.length - 1]);
  return `${firstNames.join(", ")} e ${lastName}`;
}

/**
 * Format professors list for details (full names)
 * Returns formatted string like "Ruy, Mardson e Henrique"
 */
export function formatProfessorsForDetails(professors: string[]): string {
  if (professors.length === 0) {
    return "";
  }
  if (professors.length === 1) {
    return professors[0];
  }
  if (professors.length === 2) {
    return `${professors[0]} e ${professors[1]}`;
  }
  // 3 or more: "Name1, Name2 e Name3"
  const allButLast = professors.slice(0, -1);
  const last = professors[professors.length - 1];
  return `${allButLast.join(", ")} e ${last}`;
}
