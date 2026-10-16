import { prisma } from "@/lib/server/db/prisma";
import { PrismaCalendarRoomBindingRepository } from "../prisma-calendar-room-binding-repository";
import { calendarScheduleKey } from "@/lib/shared/calendario/room-binding";

jest.mock("@/lib/server/db/prisma", () => ({
  prisma: { calendarRoomBinding: { findMany: jest.fn() }, $transaction: jest.fn() },
}));

const binding = {
  semester: "2026.2",
  sourceKey: "class",
  code: "EDO1",
  scheduleKey: calendarScheduleKey("35M23"),
  centerId: "CI",
  section: "07",
  allocationId: 123,
};
const repository = new PrismaCalendarRoomBindingRepository();

beforeEach(() => jest.clearAllMocks());

it("keeps valid preferences readable when another stored row is malformed", async () => {
  jest.mocked(prisma.calendarRoomBinding.findMany).mockResolvedValue([
    { ...binding, usuarioId: "owner", profileCourseId: "course", updatedAt: new Date() },
    {
      ...binding,
      sourceKey: "bad",
      section: "",
      usuarioId: "owner",
      profileCourseId: "course",
      updatedAt: new Date(),
    },
  ]);
  expect(await repository.list("owner", "course", "2026.2")).toEqual([binding]);
});

it("rejects malformed preferences before starting a transaction", async () => {
  await expect(repository.save("owner", "course", { ...binding, section: "" })).rejects.toThrow();
  expect(prisma.$transaction).not.toHaveBeenCalled();
});

it("cleans other courses under the user lock and applies the quota only to the current course", async () => {
  const operations: string[] = [];
  const transaction = {
    $queryRaw: jest.fn(() => {
      operations.push("lock");
      return Promise.resolve([{ cursoId: "course" }]);
    }),
    calendarRoomBinding: {
      deleteMany: jest.fn(() => {
        operations.push("cleanup");
        return Promise.resolve({ count: 64 });
      }),
      findUnique: jest.fn(() => Promise.resolve(null)),
      count: jest.fn(() => Promise.resolve(0)),
      upsert: jest.fn(() => Promise.resolve(binding)),
    },
  };
  jest
    .mocked(prisma.$transaction)
    .mockImplementationOnce(callback =>
      (callback as unknown as (value: typeof transaction) => Promise<void>)(transaction)
    );
  await repository.save("owner", "course", binding);
  expect(operations).toEqual(["lock", "cleanup"]);
  expect(transaction.calendarRoomBinding.deleteMany).toHaveBeenCalledWith({
    where: { usuarioId: "owner", profileCourseId: { not: "course" } },
  });
  expect(transaction.calendarRoomBinding.count).toHaveBeenCalledWith({
    where: { usuarioId: "owner", profileCourseId: "course", semester: "2026.2" },
  });
  expect(transaction.calendarRoomBinding.upsert).toHaveBeenCalled();
});
