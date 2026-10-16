import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { calendarScheduleKey } from "@/lib/shared/calendario/room-binding";
const databaseUrl = process.env.PLANNER_TEST_DATABASE_URL;
const testDatabase = databaseUrl ? describe : describe.skip;
testDatabase("private calendar room bindings", () => {
  it("isolates owners/courses, bounds preferences, and leaves enrollment/history untouched", async () => {
    if (!databaseUrl) {
      throw new Error("Disposable database required");
    }
    process.env.DATABASE_URL = databaseUrl;
    const { PrismaCalendarRoomBindingRepository } =
      await import("@/lib/server/db/implementations/prisma/prisma-calendar-room-binding-repository");
    const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    const suffix = randomUUID();
    const campus = await db.campus.create({ data: { nome: `Room binding ${suffix}` } });
    const center = await db.centro.create({
      data: { nome: `Room binding ${suffix}`, sigla: suffix.slice(0, 8), campusId: campus.id },
    });
    const course = await db.curso.create({
      data: { nome: `Room binding ${suffix}`, centroId: center.id },
    });
    const a = await db.usuario.create({
      data: { nome: "Room A", cursoId: course.id, centroId: center.id },
    });
    const b = await db.usuario.create({
      data: { nome: "Room B", cursoId: course.id, centroId: center.id },
    });
    const repository = new PrismaCalendarRoomBindingRepository();
    const binding = {
      semester: "2026.2",
      sourceKey: "class",
      allocationId: 123,
      code: "EDO1",
      scheduleKey: calendarScheduleKey("35M23"),
      centerId: "CI",
      section: "07",
    };
    try {
      // Old-course preferences must not consume an invisible quota after a profile change.
      await db.calendarRoomBinding.createMany({
        data: Array.from({ length: 64 }, (_, i) => ({
          ...binding,
          usuarioId: a.id,
          profileCourseId: "previous-course",
          sourceKey: `previous-${i}`,
        })),
      });
      await repository.save(a.id, course.id, binding);
      expect(
        await db.calendarRoomBinding.count({
          where: { usuarioId: a.id, profileCourseId: "previous-course" },
        })
      ).toBe(0);
      expect(await repository.list(b.id, course.id, "2026.2")).toEqual([]);
      expect(await repository.list(a.id, "changed-course", "2026.2")).toEqual([]);
      expect(await repository.list(a.id, course.id, "2026.1")).toEqual([]);
      await repository.delete(b.id, course.id, "2026.2", "class");
      expect(await repository.list(a.id, course.id, "2026.2")).toHaveLength(1);
      await expect(repository.save(a.id, "changed-course", binding)).rejects.toThrow(
        "CALENDAR_COURSE_CHANGED"
      );
      await db.calendarRoomBinding.createMany({
        data: Array.from({ length: 63 }, (_, i) => ({
          ...binding,
          usuarioId: a.id,
          profileCourseId: course.id,
          sourceKey: `quota-${i}`,
        })),
      });
      await expect(
        repository.save(a.id, course.id, { ...binding, sourceKey: "overflow" })
      ).rejects.toThrow("CALENDAR_BINDING_QUOTA");
      await repository.save(a.id, course.id, { ...binding, allocationId: 124 });
      expect(
        (await repository.list(a.id, course.id, "2026.2")).find(item => item.sourceKey === "class")
          ?.allocationId
      ).toBe(124);
      expect(await db.disciplinaSemestre.count({ where: { usuarioId: a.id } })).toBe(0);
      expect(await db.disciplinaConcluida.count({ where: { usuarioId: a.id } })).toBe(0);
      expect(await db.sigaaAcademicSnapshot.count({ where: { usuarioId: a.id } })).toBe(0);
      await db.usuario.delete({ where: { id: a.id } });
      expect(await db.calendarRoomBinding.count({ where: { usuarioId: a.id } })).toBe(0);
    } finally {
      await db.usuario.deleteMany({ where: { id: { in: [a.id, b.id] } } });
      await db.curso.delete({ where: { id: course.id } });
      await db.centro.delete({ where: { id: center.id } });
      await db.campus.delete({ where: { id: campus.id } });
      await db.$disconnect();
    }
  });
});
