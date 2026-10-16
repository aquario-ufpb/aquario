/** @jest-environment node */
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("../sigaa-offerings", () => ({ getPublicSigaaOfferings: jest.fn() }));
import { getPublicSigaaOfferings } from "../sigaa-offerings";
import {
  getLimitedPublicSigaaOfferings,
  getOfferingBatch,
  MAX_OFFERING_QUEUE,
  OfferingQueueFullError,
} from "../offerings-batch";
import type { OfferingResponse } from "@/lib/shared/planner/types";

it("bounds queued work, shares queued requests, and recovers after overload without extra upstream calls", async () => {
  let release!: () => void;
  let active = 0;
  let maximum = 0;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const mock = jest.mocked(getPublicSigaaOfferings).mockImplementation(async id => {
    active++;
    maximum = Math.max(maximum, active);
    await gate;
    active--;
    return {
      course: { id, name: id, campus: "Campus", modality: "Presencial" },
      observedAt: "2026-10-15T00:00:00Z",
      offers: [],
      warnings: [],
    } satisfies OfferingResponse;
  });
  const requests = Array.from({ length: MAX_OFFERING_QUEUE + 2 }, (_, i) =>
    getLimitedPublicSigaaOfferings(String(i + 1), "2026.2")
  );
  const shared = getLimitedPublicSigaaOfferings("3", "2026.2");
  try {
    expect(shared).toBe(requests[2]);
    expect(mock).toHaveBeenCalledTimes(2);
    await expect(getLimitedPublicSigaaOfferings("999", "2026.2")).rejects.toBeInstanceOf(
      OfferingQueueFullError
    );
    const batch = await getOfferingBatch({ semester: "2026.2", courseIds: ["998"], codes: ["A1"] });
    expect(batch).toEqual({ results: [], failedCourseIds: ["998"] });
    expect(mock).toHaveBeenCalledTimes(2);
  } finally {
    release();
    await Promise.all(requests);
  }
  expect(maximum).toBe(2);
  expect(mock).toHaveBeenCalledTimes(MAX_OFFERING_QUEUE + 2);
  await expect(getLimitedPublicSigaaOfferings("999", "2026.2")).resolves.toMatchObject({
    course: { id: "999" },
  });
  expect(mock).toHaveBeenCalledTimes(MAX_OFFERING_QUEUE + 3);
});
