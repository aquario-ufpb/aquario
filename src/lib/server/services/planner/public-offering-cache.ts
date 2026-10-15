import "server-only";
import { OFFERING_CACHE_TTL_MS } from "@/lib/shared/planner/cache";
import type { OfferingResponse } from "@/lib/shared/planner/types";
import type { IPublicOfferingCacheRepository } from "@/lib/server/db/interfaces/public-offering-cache-repository.interface";

export function createPublicOfferingCache(
  repository: IPublicOfferingCacheRepository,
  load: (courseId: string, semester: string) => Promise<OfferingResponse>,
  now = Date.now
) {
  const pending = new Map<string, Promise<OfferingResponse>>();
  const snapshot = (semester: string, courseIds: string[]) =>
    repository.findFresh(semester, courseIds, new Date(now() - OFFERING_CACHE_TTL_MS));
  return {
    snapshot,
    get: async (courseId: string, semester: string, refresh = false): Promise<OfferingResponse> => {
      if (!refresh) {
        // Cache failure must not prevent a successful upstream lookup.
        const cached = await snapshot(semester, [courseId]).catch(() => []);
        if (cached.length) {
          return cached[0];
        }
      }
      const key = `${courseId}:${semester}`;
      const running = pending.get(key);
      if (running) {
        return running;
      }
      const request = load(courseId, semester)
        .then(async data => {
          await repository.save(semester, data).catch(() => undefined);
          return data;
        })
        .finally(() => pending.delete(key));
      pending.set(key, request);
      return request;
    },
  };
}
