/**
 * Utility functions for the Maps feature
 */

/**
 * Extract first name from a full name
 * Handles cases like "José Antonio" -> "José", "Gledson Elias" -> "Gledson"
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

/**
 * Format labs list for display
 * Returns formatted string like "LASID" or "COMPOSE, LIA e DAT"
 * @param labs - Array of lab slugs
 * @param entidadesMap - Optional map of Entidade objects to get names from
 */
export function formatLabsForDisplay(
  labs: string[],
  entidadesMap?: Map<string, { name: string }>
): string {
  if (labs.length === 0) {
    return "";
  }

  // If entidadesMap is provided, use entidade names; otherwise use slugs
  const getLabName = (slug: string): string => {
    if (entidadesMap) {
      const entidade = entidadesMap.get(slug);
      return entidade?.name?.split(" ")[0] || slug.toUpperCase().split(" ")[0];
    }
    return slug.toUpperCase();
  };

  const labNames = labs.map(getLabName);

  if (labNames.length === 1) {
    return labNames[0];
  }
  if (labNames.length === 2) {
    return `${labNames[0]} e ${labNames[1]}`;
  }
  // 3 or more: "Lab1, Lab2 e Lab3"
  const allButLast = labNames.slice(0, -1);
  const last = labNames[labNames.length - 1];
  return `${allButLast.join(", ")} e ${last}`;
}
