import { plannerApi } from "./api";
import type { OfferingSnapshotResponse } from "@/lib/shared/planner/offering-search";

export type CachedCurriculumOfferings = OfferingSnapshotResponse & { failedCourseIds: string[] };

/** Read public cache, preserving completed batches; retries revisit only failed batches. */
export async function readCachedCurriculumOfferings(
  semester: string,
  courseIds: readonly string[],
  codes: string[],
  signal?: AbortSignal,
  previous?: CachedCurriculumOfferings
): Promise<CachedCurriculumOfferings> {
  const allIds = [...new Set(courseIds)];
  const ids = previous ? allIds.filter(id => previous.failedCourseIds.includes(id)) : allIds;
  const retried = new Set(ids);
  const snapshot: CachedCurriculumOfferings = {
    results: previous?.results ?? [],
    missingCourseIds: previous?.missingCourseIds.filter(id => !retried.has(id)) ?? [],
    failedCourseIds: [],
  };
  snapshot.results = [...snapshot.results];
  for (let offset = 0; offset < ids.length; offset += 200) {
    signal?.throwIfAborted();
    const batch = ids.slice(offset, offset + 200);
    try {
      const response = await plannerApi.offeringSnapshot(
        { semester, courseIds: batch, codes },
        signal
      );
      snapshot.results.push(...response.results);
      snapshot.missingCourseIds.push(...response.missingCourseIds);
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      snapshot.missingCourseIds.push(...batch);
      snapshot.failedCourseIds.push(...batch);
    }
  }
  return snapshot;
}
