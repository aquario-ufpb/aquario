import "server-only";
import type {
  OfferingBatchRequest,
  OfferingBatchResponse,
} from "@/lib/shared/planner/offering-search";
import { getPublicSigaaOfferings } from "./sigaa-offerings";

// Shared in-flight work and a small process-wide limit protect the public JSF service.
let active = 0;
export const MAX_OFFERING_QUEUE = 8;
export class OfferingQueueFullError extends Error {}
const waiting: (() => void)[] = [];
const pending = new Map<string, ReturnType<typeof getPublicSigaaOfferings>>();
async function limited<T>(task: () => Promise<T>): Promise<T> {
  if (active >= 2) {
    if (waiting.length >= MAX_OFFERING_QUEUE) {
      throw new OfferingQueueFullError("SIGAA_QUEUE_FULL");
    }
    await new Promise<void>(resolve => waiting.push(resolve));
  } else {
    active++;
  }
  try {
    return await task();
  } finally {
    const next = waiting.shift();
    if (next) {
      next();
    } else {
      active--;
    }
  }
}
export function getLimitedPublicSigaaOfferings(
  courseId: string,
  semester: string,
  refresh = false
) {
  const key = `${courseId}:${semester}:${refresh}`;
  const existing = pending.get(key);
  if (existing) {
    return existing;
  }
  const promise = limited(() => getPublicSigaaOfferings(courseId, semester, refresh)).finally(() =>
    pending.delete(key)
  );
  pending.set(key, promise);
  return promise;
}
export async function getOfferingBatch(
  request: OfferingBatchRequest
): Promise<OfferingBatchResponse> {
  const codes = new Set(request.codes);
  const courseIds = [...new Set(request.courseIds)];
  const responses = await Promise.allSettled(
    courseIds.map(id => getLimitedPublicSigaaOfferings(id, request.semester, request.refresh))
  );
  const result: OfferingBatchResponse = { results: [], failedCourseIds: [] };
  responses.forEach((response, index) => {
    if (response.status === "fulfilled") {
      result.results.push({
        ...response.value,
        offers: response.value.offers.filter(offer => codes.has(offer.code)),
      });
    } else {
      result.failedCourseIds.push(courseIds[index]);
    }
  });
  return result;
}
