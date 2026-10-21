import { normalizeCode } from "./requirements";
import type { OfferingResponse, PlannerOffer } from "./types";

/** Merge bounded offerings, prioritizing missing codes; refresh replaces only queried reservations. */
export function mergeCachedOfferings(
  previous: PlannerOffer[],
  results: OfferingResponse[],
  limit = 1500,
  refreshedCodes?: readonly string[]
): { offers: PlannerOffer[]; omitted: number } {
  const originals = new Map(previous.map(offer => [offer.id, offer]));
  const existing = new Map(originals);
  if (refreshedCodes) {
    const codes = new Set(refreshedCodes.map(normalizeCode));
    const courseIds = results.map(result => result.course.id);
    for (const [id, offer] of existing) {
      if (
        offer.source !== "SIGAA" ||
        !codes.has(normalizeCode(offer.code)) ||
        !courseIds.some(courseId =>
          Object.prototype.hasOwnProperty.call(offer.reservations, courseId)
        )
      ) {
        continue;
      }
      const reservations = { ...offer.reservations };
      for (const courseId of courseIds) {
        delete reservations[courseId];
      }
      if (Object.keys(reservations).length) {
        existing.set(id, { ...offer, reservations });
      } else {
        existing.delete(id);
      }
    }
  }
  const incoming = new Map<string, PlannerOffer>();
  for (const result of results) {
    for (const offer of result.offers) {
      const original = incoming.get(offer.id) ?? existing.get(offer.id);
      const local = originals.get(offer.id);
      if (original?.source === "MANUAL") {
        incoming.set(offer.id, original);
        continue;
      }
      incoming.set(
        offer.id,
        original
          ? {
              ...offer,
              reservations: { ...original.reservations, ...offer.reservations },
              location: local?.location ?? original?.location ?? offer.location,
              coordinates: local?.coordinates ?? original?.coordinates ?? offer.coordinates,
              observedAt:
                original.observedAt < offer.observedAt ? original.observedAt : offer.observedAt,
            }
          : {
              ...offer,
              location: local?.location ?? offer.location,
              coordinates: local?.coordinates ?? offer.coordinates,
            }
      );
    }
  }
  const candidates: PlannerOffer[] = [];
  for (const offer of incoming.values()) {
    if (originals.has(offer.id)) {
      existing.set(offer.id, offer);
    } else {
      candidates.push(offer);
    }
  }
  const covered = new Set([...existing.values()].map(offer => normalizeCode(offer.code)));
  const first: PlannerOffer[] = [],
    rest: PlannerOffer[] = [];
  for (const offer of candidates) {
    const code = normalizeCode(offer.code);
    if (!covered.has(code)) {
      first.push(offer);
      covered.add(code);
    } else {
      rest.push(offer);
    }
  }
  const selected = [...first, ...rest].slice(0, Math.max(0, limit - existing.size));
  return {
    offers: [...existing.values(), ...selected],
    omitted: candidates.length - selected.length,
  };
}
