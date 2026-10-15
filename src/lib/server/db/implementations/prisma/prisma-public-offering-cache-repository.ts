import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/db/prisma";
import type { OfferingResponse } from "@/lib/shared/planner/types";
import type { IPublicOfferingCacheRepository } from "../../interfaces/public-offering-cache-repository.interface";
export class PrismaPublicOfferingCacheRepository implements IPublicOfferingCacheRepository {
  async findFresh(semester: string, courseIds: string[], since: Date) {
    const rows = await prisma.publicSigaaOfferingCache.findMany({
      where: { semester, courseId: { in: courseIds }, observedAt: { gte: since } },
      select: { payload: true },
    });
    return rows.map(row => row.payload as unknown as OfferingResponse);
  }
  async save(semester: string, data: OfferingResponse) {
    await prisma.publicSigaaOfferingCache.upsert({
      where: { courseId_semester: { courseId: data.course.id, semester } },
      create: {
        courseId: data.course.id,
        semester,
        payload: data as unknown as Prisma.InputJsonValue,
        observedAt: new Date(data.observedAt),
      },
      update: {
        payload: data as unknown as Prisma.InputJsonValue,
        observedAt: new Date(data.observedAt),
      },
    });
  }
}
