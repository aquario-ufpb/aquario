import { plannerApi } from "../api";
import { readCachedCurriculumOfferings } from "../cached-offerings";
jest.mock("../api", () => ({ plannerApi: { offeringSnapshot: jest.fn() } }));
it("chunks a larger course catalog without turning cache misses into upstream requests", async () => {
  const ids = Array.from({ length: 405 }, (_, i) => String(i + 1));
  jest
    .mocked(plannerApi.offeringSnapshot)
    .mockImplementation(body => Promise.resolve({ results: [], missingCourseIds: body.courseIds }));
  expect(await readCachedCurriculumOfferings("2026.2", [...ids, "1"], ["OPT1"])).toEqual({
    results: [],
    missingCourseIds: ids,
  });
  expect(plannerApi.offeringSnapshot).toHaveBeenCalledTimes(3);
  expect(
    jest.mocked(plannerApi.offeringSnapshot).mock.calls.map(([body]) => body.courseIds.length)
  ).toEqual([200, 200, 5]);
  expect(
    jest.mocked(plannerApi.offeringSnapshot).mock.calls.flatMap(([body]) => body.courseIds)
  ).toEqual(ids);
});
it("stops before requesting cache when the search was aborted", async () => {
  jest.clearAllMocks();
  const controller = new AbortController();
  controller.abort();
  await expect(
    readCachedCurriculumOfferings("2026.2", ["1"], ["OPT1"], controller.signal)
  ).rejects.toThrow();
  expect(plannerApi.offeringSnapshot).not.toHaveBeenCalled();
});
