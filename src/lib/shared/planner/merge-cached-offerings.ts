import { normalizeCode } from "./requirements";
import type { OfferingResponse, PlannerOffer } from "./types";

/** Preserve the draft and fill missing codes first when automatic cache exceeds its capacity. */
export function mergeCachedOfferings(
  previous: PlannerOffer[],
  results: OfferingResponse[],
  limit = 1500
): { offers: PlannerOffer[]; omitted: number } {
  const existing = new Map(previous.map(offer => [offer.id, offer]));
  const incoming = new Map<string, PlannerOffer>();
  for (const result of results) {
    for (const offer of result.offers) {
      const original = incoming.get(offer.id) ?? existing.get(offer.id);
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
              location: original.location ?? offer.location,
              coordinates: original.coordinates ?? offer.coordinates,
              observedAt:
                original.observedAt < offer.observedAt ? original.observedAt : offer.observedAt,
            }
          : offer
      );
    }
  }
  const candidates: PlannerOffer[] = [];
  for (const offer of incoming.values()) {
    if (existing.has(offer.id)) {
      existing.set(offer.id, offer);
    } else {
      candidates.push(offer);
    }
  }
  const covered = new Set(previous.map(offer => normalizeCode(offer.code)));
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
