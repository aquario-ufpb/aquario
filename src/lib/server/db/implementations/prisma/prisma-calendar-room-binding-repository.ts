import { prisma } from "@/lib/server/db/prisma";
import type { ICalendarRoomBindingRepository } from "../../interfaces/calendar-room-binding-repository.interface";
import { roomBindingSchema, type CalendarRoomBinding } from "@/lib/shared/calendario/room-binding";
export class PrismaCalendarRoomBindingRepository implements ICalendarRoomBindingRepository {
  async list(ownerId: string, courseId: string, semester: string) {
    const rows = await prisma.calendarRoomBinding.findMany({
      where: { usuarioId: ownerId, profileCourseId: courseId, semester },
      take: 64,
    });
    return rows.flatMap(row => {
      const parsed = roomBindingSchema.safeParse({
        semester: row.semester,
        sourceKey: row.sourceKey,
        code: row.code,
        scheduleKey: row.scheduleKey,
        centerId: row.centerId,
        section: row.section,
        allocationId: row.allocationId,
      });
      return parsed.success ? [parsed.data] : [];
    });
  }
  async save(ownerId: string, courseId: string, binding: CalendarRoomBinding) {
    binding = roomBindingSchema.parse(binding);
    await prisma.$transaction(async transaction => {
      const users = await transaction.$queryRaw<
        { cursoId: string }[]
      >`SELECT "cursoId" FROM "Usuario" WHERE "id" = ${ownerId} FOR UPDATE`;
      if (users[0]?.cursoId !== courseId) {
        throw new Error("CALENDAR_COURSE_CHANGED");
      }
      await transaction.calendarRoomBinding.deleteMany({
        where: { usuarioId: ownerId, profileCourseId: { not: courseId } },
      });
      const where = {
        usuarioId_semester_sourceKey: {
          usuarioId: ownerId,
          semester: binding.semester,
          sourceKey: binding.sourceKey,
        },
      };
      const existing = await transaction.calendarRoomBinding.findUnique({ where });
      if (
        !existing &&
        (await transaction.calendarRoomBinding.count({
          where: { usuarioId: ownerId, profileCourseId: courseId, semester: binding.semester },
        })) >= 64
      ) {
        throw new Error("CALENDAR_BINDING_QUOTA");
      }
      await transaction.calendarRoomBinding.upsert({
        where,
        create: { ...binding, usuarioId: ownerId, profileCourseId: courseId },
        update: { ...binding, profileCourseId: courseId },
      });
    });
  }
  async delete(ownerId: string, courseId: string, semester: string, sourceKey: string) {
    await prisma.calendarRoomBinding.deleteMany({
      where: { usuarioId: ownerId, profileCourseId: courseId, semester, sourceKey },
    });
  }
}
