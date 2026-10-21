import { mergeCachedOfferings } from "../merge-cached-offerings";
import type { PlannerOffer, OfferingResponse } from "../types";
const offer = (id: string, code: string): PlannerOffer => ({
  id,
  code,
  name: code,
  section: "01",
  semester: "2026.2",
  schedule: "2M12",
  teacher: "",
  location: null,
  coordinates: null,
  source: "SIGAA",
  reservations: { "1": 20 },
  totalSeats: null,
  availableSeats: null,
  demand: null,
  observedAt: "2026-10-15T12:00:00Z",
  sourceUrl: null,
});
const row = (offers: PlannerOffer[]): OfferingResponse => ({
  offers,
  course: { id: "2", name: "Course", campus: "Campus", modality: "Presencial" },
  warnings: [],
  observedAt: "2026-10-15T12:00:00Z",
});
it("preserves chosen offers and gives one slot to each uncovered code before additional sections", () => {
  const previous = Array.from({ length: 1498 }, (_, i) => offer(`own-${i}`, "A1"));
  const extra = [
    offer("other-a", "A1"),
    offer("first-b", "B2"),
    offer("second-b", "B2"),
    offer("first-c", "C3"),
  ];
  const result = mergeCachedOfferings(previous, [row(extra)]);
  expect(result.offers).toHaveLength(1500);
  expect(result.offers.slice(0, 1498)).toEqual(previous);
  expect(result.offers.slice(1498).map(item => item.id)).toEqual(["first-b", "first-c"]);
  expect(result.omitted).toBe(2);
  expect(previous).toHaveLength(1498);
});
it("deduplicates shared sections, preserves manual data, and reports overflow even when already full", () => {
  const manual = { ...offer("manual", "A1"), source: "MANUAL" as const, location: "Manual" };
  const result = mergeCachedOfferings(
    [manual],
    [row([offer("manual", "A1"), offer("new", "B2")])],
    1
  );
  expect(result.offers).toEqual([manual]);
  expect(result.omitted).toBe(1);
});

it("replaces refreshed reservations only for queried courses and codes, preserving manual offers", () => {
  const removed = { ...offer("removed", "A1"), reservations: { "2": 20 } };
  const shared = { ...offer("shared", "A1"), reservations: { "1": 10, "2": 20 } };
  const unqueried = { ...offer("unqueried", "B2"), reservations: { "2": 20 } };
  const manual = { ...removed, id: "manual", source: "MANUAL" as const };
  const refreshed = mergeCachedOfferings([removed, shared, unqueried, manual], [row([])], 1500, [
    "A1",
  ]);
  expect(refreshed.offers).toEqual([{ ...shared, reservations: { "1": 10 } }, unqueried, manual]);
});

it("retains local room metadata when replacing the only reservation with a fresh observation", () => {
  const previous = {
    ...offer("same", "A1"),
    reservations: { "2": 20 },
    location: "Sala confirmada",
  };
  const incoming = {
    ...previous,
    location: null,
    availableSeats: 0,
    observedAt: "2026-10-21T12:00:00Z",
  };
  const merged = mergeCachedOfferings([previous], [row([incoming])], 1500, ["A1"]);
  expect(merged.offers).toEqual([{ ...incoming, location: "Sala confirmada" }]);
});
