import { semesterSchema } from "./types";
/** Enrollment planning starts after the imported/current term, while keeping the selector editable. */
export function nextPlanningSemester(source?: string | null, now = new Date()) {
  const current =
    source && semesterSchema.safeParse(source).success
      ? source
      : `${now.getFullYear()}.${now.getMonth() < 6 ? 1 : 2}`;
  const [year, period] = current.split(".").map(Number);
  return period === 1 ? `${year}.2` : `${year + 1}.1`;
}
