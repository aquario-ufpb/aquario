/** @jest-environment node */
jest.mock("@/lib/server/db/prisma", () => ({
  prisma: { publicSigaaOfferingCache: { findMany: jest.fn() } },
}));
import { prisma } from "@/lib/server/db/prisma";
import { PrismaPublicOfferingCacheRepository } from "../prisma-public-offering-cache-repository";
import type { OfferingResponse } from "@/lib/shared/planner/types";

const observedAt = "2026-10-15T00:00:00Z";
const response: OfferingResponse = {
  course: { id: "123", name: "Course", campus: "Campus", modality: "Presencial" },
  observedAt,
  warnings: [],
  offers: [
    {
      id: "sigaa:2026.2:A1:01:2M12",
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
      observedAt,
      sourceUrl: null,
    },
  ],
};
const validRow = () => ({
  courseId: "123",
  semester: "2026.2",
  observedAt: new Date(observedAt),
  payload: structuredClone(response),
});
const rowsMock = jest.mocked(prisma.publicSigaaOfferingCache.findMany);
beforeEach(() => jest.clearAllMocks());
it("returns validated public cache entries and requests only the selected semester/courses/freshness", async () => {
  rowsMock.mockResolvedValue([validRow()]);
  const since = new Date("2026-10-14T22:00:00Z");
  expect(
    await new PrismaPublicOfferingCacheRepository().findFresh("2026.2", ["123"], since)
  ).toEqual([response]);
  expect(rowsMock).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { semester: "2026.2", courseId: { in: ["123"] }, observedAt: { gte: since } },
    })
  );
});
it.each([
  ["invalid JSON shape", () => ({ ...validRow(), payload: { offers: "corrupt" } })],
  ["course identity mismatch", () => ({ ...validRow(), courseId: "456" })],
  ["row semester mismatch", () => ({ ...validRow(), semester: "2026.1" })],
  [
    "observation timestamp mismatch",
    () => ({ ...validRow(), observedAt: new Date("2026-10-15T01:00:00Z") }),
  ],
  [
    "offer semester mismatch",
    () => {
      const row = validRow();
      row.payload.offers[0].semester = "2026.1";
      return row;
    },
  ],
  [
    "manual offer in public cache",
    () => {
      const row = validRow();
      row.payload.offers[0].source = "MANUAL";
      return row;
    },
  ],
] as const)("drops %s without discarding valid neighboring rows", async (_label, corrupt) => {
  rowsMock.mockResolvedValue([corrupt(), validRow()] as unknown as Awaited<
    ReturnType<typeof prisma.publicSigaaOfferingCache.findMany>
  >);
  await expect(
    new PrismaPublicOfferingCacheRepository().findFresh("2026.2", ["123"], new Date(0))
  ).resolves.toEqual([response]);
});
