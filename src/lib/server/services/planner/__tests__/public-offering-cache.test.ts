/** @jest-environment node */
jest.mock("server-only", () => ({}), { virtual: true });
import { createPublicOfferingCache } from "../public-offering-cache";
import { OFFERING_CACHE_TTL_MS } from "@/lib/shared/planner/cache";
import type { OfferingResponse } from "@/lib/shared/planner/types";
import type { IPublicOfferingCacheRepository } from "@/lib/server/db/interfaces/public-offering-cache-repository.interface";
function setup() {
  let time = Date.parse("2026-10-15T10:00:00Z");
  const rows = new Map<string, OfferingResponse>();
  const repository: IPublicOfferingCacheRepository = {
    consumeRequest: jest.fn(() => Promise.resolve(true)),
    findFresh: jest.fn((semester, ids, since) =>
      Promise.resolve(
        ids.flatMap(id => {
          const row = rows.get(`${id}:${semester}`);
          return row && Date.parse(row.observedAt) >= since.getTime() ? [row] : [];
        })
      )
    ),
    save: jest.fn((semester, data) => {
      rows.set(`${data.course.id}:${semester}`, data);
      return Promise.resolve();
    }),
  };
  const load = jest.fn(
    (id: string, _semester: string): Promise<OfferingResponse> =>
      Promise.resolve({
        course: { id, name: id, campus: "João Pessoa", modality: "Presencial" },
        observedAt: new Date(time).toISOString(),
        offers: [],
        warnings: [],
      })
  );
  const cache = createPublicOfferingCache(repository, load, () => time);
  return {
    repository,
    load,
    cache,
    rows,
    advance: (ms: number) => {
      time += ms;
    },
    restart: () => createPublicOfferingCache(repository, load, () => time),
  };
}
test("reuses persisted public offers across cache instances without upstream calls", async () => {
  const s = setup();
  const first = await s.cache.get("123", "2026.2");
  expect(await s.cache.get("123", "2026.2")).toEqual(first);
  expect(await s.restart().get("123", "2026.2")).toEqual(first);
  expect(s.load).toHaveBeenCalledTimes(1);
});
test("cache reads never extend the original two-hour observation window", async () => {
  const s = setup();
  const first = await s.cache.get("123", "2026.2");
  s.advance(OFFERING_CACHE_TTL_MS - 1);
  expect((await s.cache.get("123", "2026.2")).observedAt).toBe(first.observedAt);
  s.advance(2);
  expect((await s.cache.get("123", "2026.2")).observedAt).not.toBe(first.observedAt);
  expect(s.load).toHaveBeenCalledTimes(2);
});
test("course and semester caches do not contaminate one another", async () => {
  const s = setup();
  await s.cache.get("123", "2026.2");
  await s.cache.get("123", "2026.1");
  await s.cache.get("456", "2026.2");
  expect(s.load).toHaveBeenCalledTimes(3);
});
test("manual refresh bypasses cache and concurrent refreshes share upstream work", async () => {
  const s = setup();
  const old = await s.cache.get("123", "2026.2");
  let release!: (data: OfferingResponse) => void;
  s.load.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        release = resolve;
      })
  );
  const first = s.cache.get("123", "2026.2", true),
    second = s.cache.get("123", "2026.2", true);
  expect(await s.cache.get("123", "2026.2")).toEqual(old);
  const newer = { ...old, observedAt: "2026-10-15T11:00:00Z" };
  release(newer);
  expect(await first).toEqual(newer);
  expect(await second).toEqual(newer);
  expect(s.load).toHaveBeenCalledTimes(2);
});
test("failed refresh keeps the previous observation instead of caching false empty data", async () => {
  const s = setup();
  const old = await s.cache.get("123", "2026.2");
  s.load.mockRejectedValueOnce(new Error("SIGAA offline"));
  await expect(s.cache.get("123", "2026.2", true)).rejects.toThrow("SIGAA offline");
  expect(await s.cache.get("123", "2026.2")).toEqual(old);
  expect(s.repository.save).toHaveBeenCalledTimes(1);
});
test("bulk cache snapshot is a single database read and never visits SIGAA", async () => {
  const s = setup();
  await s.cache.get("123", "2026.2");
  await s.cache.get("456", "2026.2");
  jest.mocked(s.repository.findFresh).mockClear();
  s.load.mockClear();
  expect(await s.cache.snapshot("2026.2", ["123", "456", "789"])).toHaveLength(2);
  expect(s.repository.findFresh).toHaveBeenCalledTimes(1);
  expect(s.load).not.toHaveBeenCalled();
});
test("cache storage failure does not discard a successful public response", async () => {
  const s = setup();
  jest.mocked(s.repository.findFresh).mockRejectedValueOnce(new Error("cache offline"));
  jest.mocked(s.repository.save).mockRejectedValueOnce(new Error("cache offline"));
  expect((await s.cache.get("123", "2026.2")).course.id).toBe("123");
});
