import { plannerApi } from "./api";
import type { OfferingSnapshotResponse } from "@/lib/shared/planner/offering-search";

/** Read existing public cache only. Missing courses never trigger upstream lookups. */
export async function readCachedCurriculumOfferings(
  semester: string,
  courseIds: readonly string[],
  codes: string[],
  signal?: AbortSignal
): Promise<OfferingSnapshotResponse> {
  const ids = [...new Set(courseIds)];
  const snapshot: OfferingSnapshotResponse = { results: [], missingCourseIds: [] };
  for (let offset = 0; offset < ids.length; offset += 200) {
    signal?.throwIfAborted();
    const response = await plannerApi.offeringSnapshot(
      { semester, courseIds: ids.slice(offset, offset + 200), codes },
      signal
    );
    snapshot.results.push(...response.results);
    snapshot.missingCourseIds.push(...response.missingCourseIds);
  }
  return snapshot;
}
