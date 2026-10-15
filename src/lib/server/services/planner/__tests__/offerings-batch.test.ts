/** @jest-environment node */
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("../sigaa-offerings", () => ({ getPublicSigaaOfferings: jest.fn() }));
import { getPublicSigaaOfferings } from "../sigaa-offerings";
import { getOfferingBatch } from "../offerings-batch";
import { offeringBatchSchema } from "@/lib/shared/planner/offering-search";
import type { OfferingResponse } from "@/lib/shared/planner/types";
const mock = jest.mocked(getPublicSigaaOfferings);
const response = (id: string): OfferingResponse => ({
  course: { id, name: id, campus: "João Pessoa", modality: "Presencial" },
  observedAt: "2026-10-15T00:00:00Z",
  warnings: [],
  offers: ["A1", "B2"].map(code => ({
    id: `${id}:${code}`,
    code,
    name: code,
    section: "01",
    semester: "2026.2",
    schedule: "2M12",
    teacher: "",
    location: null,
    coordinates: null,
    source: "SIGAA",
    reservations: { [id]: 5 },
    availableSeats: null,
    totalSeats: null,
    demand: null,
    observedAt: "2026-10-15T00:00:00Z",
    sourceUrl: null,
  })),
});
beforeEach(() => mock.mockReset());
it("returns all matching classes across courses without inventing reservations for the profile course", async () => {
  mock.mockImplementation(id => Promise.resolve(response(id)));
  const data = await getOfferingBatch({
    semester: "2026.2",
    courseIds: ["123", "456"],
    codes: ["A1"],
  });
  expect(data.results).toHaveLength(2);
  expect(data.results[1].offers[0].reservations).toEqual({ "456": 5 });
  expect(data.results.every(r => r.offers.length === 1 && r.offers[0].code === "A1")).toBe(true);
});
it("reports partial failures explicitly instead of declaring a discipline unoffered", async () => {
  mock.mockImplementation(id =>
    id === "456" ? Promise.reject(new Error("offline")) : Promise.resolve(response(id))
  );
  const data = await getOfferingBatch({
    semester: "2026.2",
    courseIds: ["123", "456"],
    codes: ["A1"],
  });
  expect(data.failedCourseIds).toEqual(["456"]);
  expect(data.results).toHaveLength(1);
});
it("limits concurrent upstream lookups to two and shares work for the same course", async () => {
  let active = 0,
    maximum = 0;
  let release!: () => void;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  mock.mockImplementation(async id => {
    active++;
    maximum = Math.max(maximum, active);
    await gate;
    active--;
    return response(id);
  });
  const request = { semester: "2026.2", courseIds: ["123", "456", "789", "999"], codes: ["A1"] };
  const one = getOfferingBatch(request);
  const two = getOfferingBatch({ ...request, codes: ["B2"] });
  await Promise.resolve();
  expect(mock).toHaveBeenCalledTimes(2);
  release();
  const [first, second] = await Promise.all([one, two]);
  expect(maximum).toBe(2);
  expect(mock).toHaveBeenCalledTimes(4);
  expect(first.results[0].offers[0].code).toBe("A1");
  expect(second.results[0].offers[0].code).toBe("B2");
});
it("rejects arbitrary URLs and overly broad batches", () => {
  expect(
    offeringBatchSchema.safeParse({
      semester: "2026.2",
      courseIds: ["https://example.com"],
      codes: ["A1"],
    }).success
  ).toBe(false);
  expect(
    offeringBatchSchema.safeParse({
      semester: "2026.2",
      courseIds: ["1", "2", "3", "4", "5"],
      codes: ["A1"],
    }).success
  ).toBe(false);
});
