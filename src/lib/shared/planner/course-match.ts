import type { PublicCourse } from "./types";
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
/** Public course ids differ from local profile ids. Ambiguities require confirmation. */
export function matchPublicCourse(
  courses: PublicCourse[],
  sourceCourse?: string | null,
  profileCourse?: string | null
): PublicCourse | null {
  const source = normalize(sourceCourse || profileCourse || "");
  if (!source) {
    return null;
  }
  const matches = courses.filter(course => {
    const name = normalize(course.name);
    return source === name || source.startsWith(`${name} `);
  });
  if (matches.length === 1) {
    return matches[0];
  }
  const campusMatches = matches.filter(
    course => course.campus && source.includes(normalize(course.campus))
  );
  return campusMatches.length === 1 ? campusMatches[0] : null;
}
