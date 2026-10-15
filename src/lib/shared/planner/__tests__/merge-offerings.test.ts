import { mergeOfferings } from "../merge-offerings";
import type { PlannerOffer } from "../types";
const offer: PlannerOffer = {
  id: "same",
  code: "A1",
  name: "A",
  section: "01",
  semester: "2026.2",
  schedule: "2M12",
  teacher: "",
  location: null,
  coordinates: null,
  source: "SIGAA",
  reservations: { "123": 10 },
  totalSeats: null,
  availableSeats: null,
  demand: null,
  observedAt: "2026-10-14T00:00:00Z",
  sourceUrl: null,
};
it("keeps the manual location when refreshing the only course", () => {
  const result = mergeOfferings(
    [{ ...offer, location: "CI", coordinates: { lat: -7, lng: -34 } }],
    [{ ...offer, reservations: { "123": 0 } }],
    "123"
  );
  expect(result[0]).toMatchObject({
    location: "CI",
    coordinates: { lat: -7, lng: -34 },
    reservations: { "123": 0 },
  });
});
it("does not make another course's older reservation appear newly observed", () => {
  const result = mergeOfferings(
    [offer],
    [{ ...offer, reservations: { "456": 5 }, observedAt: "2026-10-15T00:00:00Z" }],
    "456"
  );
  expect(result[0].reservations).toEqual({ "123": 10, "456": 5 });
  expect(result[0].observedAt).toBe(offer.observedAt);
});
it("removes withdrawn offers for the refreshed course without removing manual entries", () => {
  const result = mergeOfferings(
    [offer, { ...offer, id: "manual", source: "MANUAL", reservations: {} }],
    [],
    "123"
  );
  expect(result.map(item => item.id)).toEqual(["manual"]);
});

it("does not delete a course's offers when refreshing another course with no matching offers", () => {
  expect(mergeOfferings([offer], [], "456")).toEqual([offer]);
});
