import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/db/prisma";
import { offeringResponseSchema, type OfferingResponse } from "@/lib/shared/planner/types";
import type { IPublicOfferingCacheRepository } from "../../interfaces/public-offering-cache-repository.interface";
export class PrismaPublicOfferingCacheRepository implements IPublicOfferingCacheRepository {
  async findFresh(semester: string, courseIds: string[], since: Date) {
    const rows = await prisma.publicSigaaOfferingCache.findMany({
      where: { semester, courseId: { in: courseIds }, observedAt: { gte: since } },
      select: { payload: true, courseId: true, semester: true, observedAt: true },
    });
    return rows.flatMap(row => {
      const parsed = offeringResponseSchema.safeParse(row.payload);
      return parsed.success &&
        parsed.data.course.id === row.courseId &&
        row.semester === semester &&
        Date.parse(parsed.data.observedAt) === row.observedAt.getTime() &&
        parsed.data.offers.every(offer => offer.semester === semester && offer.source === "SIGAA")
        ? [parsed.data]
        : [];
    });
  }
  async consumeRequest(key: string, limit: number, windowMs: number) {
    const rows = await prisma.$queryRaw<{ expiresAt: Date }[]>`
      INSERT INTO "PublicOfferingRequestLimit" ("key", "count", "expiresAt")
      VALUES (${key}, 1, CURRENT_TIMESTAMP + ${windowMs} * INTERVAL '1 millisecond')
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "PublicOfferingRequestLimit"."expiresAt" <= CURRENT_TIMESTAMP THEN 1 ELSE "PublicOfferingRequestLimit"."count" + 1 END,
        "expiresAt" = CASE WHEN "PublicOfferingRequestLimit"."expiresAt" <= CURRENT_TIMESTAMP THEN CURRENT_TIMESTAMP + ${windowMs} * INTERVAL '1 millisecond' ELSE "PublicOfferingRequestLimit"."expiresAt" END
      WHERE "PublicOfferingRequestLimit"."expiresAt" <= CURRENT_TIMESTAMP OR "PublicOfferingRequestLimit"."count" < ${limit}
      RETURNING "expiresAt"`;
    // Bound retention of anonymous hashed request keys; never persist raw client addresses.
    await prisma.$executeRaw`DELETE FROM "PublicOfferingRequestLimit" WHERE "key" IN (SELECT "key" FROM "PublicOfferingRequestLimit" WHERE "expiresAt" < CURRENT_TIMESTAMP LIMIT 200)`;
    return rows.length > 0;
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
