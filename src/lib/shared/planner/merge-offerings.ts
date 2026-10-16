import type { PlannerOffer } from "./types";

/** Refresh one course's reservations without discarding other courses or manual locations. */
export function mergeOfferings(
  previous: PlannerOffer[],
  incoming: PlannerOffer[],
  courseId: string
): PlannerOffer[] {
  const originals = new Map(previous.map(offer => [offer.id, offer]));
  const merged = new Map(previous.map(offer => [offer.id, offer]));
  for (const [id, offer] of merged) {
    if (
      offer.source !== "SIGAA" ||
      !Object.prototype.hasOwnProperty.call(offer.reservations, courseId)
    ) {
      continue;
    }
    const reservations = { ...offer.reservations };
    delete reservations[courseId];
    if (Object.keys(reservations).length) {
      merged.set(id, { ...offer, reservations });
    } else {
      merged.delete(id);
    }
  }
  for (const offer of incoming) {
    const otherCourses = merged.get(offer.id);
    const original = originals.get(offer.id);
    merged.set(offer.id, {
      ...offer,
      reservations: { ...otherCourses?.reservations, ...offer.reservations },
      location: original?.location ?? offer.location,
      coordinates: original?.coordinates ?? offer.coordinates,
      // Use the oldest observation when counts from more than one query are combined.
      observedAt:
        otherCourses && otherCourses.observedAt < offer.observedAt
          ? otherCourses.observedAt
          : offer.observedAt,
    });
  }
  return [...merged.values()];
}
