import { plannerApi } from "./api";
import type { OfferingResponse } from "@/lib/shared/planner/types";

/** Read existing public cache only. Missing courses never trigger upstream lookups. */
export async function readCachedCurriculumOfferings(
  semester: string,
  courseIds: readonly string[],
  codes: string[],
  signal?: AbortSignal
): Promise<OfferingResponse[]> {
  const ids = [...new Set(courseIds)];
  const results: OfferingResponse[] = [];
  for (let offset = 0; offset < ids.length; offset += 200) {
    signal?.throwIfAborted();
    const response = await plannerApi.offeringSnapshot(
      { semester, courseIds: ids.slice(offset, offset + 200), codes },
      signal
    );
    results.push(...response.results);
  }
  return results;
}
