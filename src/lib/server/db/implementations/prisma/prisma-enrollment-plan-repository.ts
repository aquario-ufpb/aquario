import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/db/prisma";
import { draftSchema, type PlannerDraft } from "@/lib/shared/planner/types";
import type { IEnrollmentPlanRepository } from "../../interfaces/enrollment-plan-repository.interface";

const summary = (item: {
  id: string;
  name: string;
  semester: string;
  profileCourseId: string;
  updatedAt: Date;
}) => ({
  id: item.id,
  name: item.name,
  semester: item.semester,
  profileCourseId: item.profileCourseId,
  updatedAt: item.updatedAt.toISOString(),
});
export class PrismaEnrollmentPlanRepository implements IEnrollmentPlanRepository {
  async list(ownerId: string) {
    const items = await prisma.enrollmentPlan.findMany({
      where: { usuarioId: ownerId },
      select: { id: true, name: true, semester: true, profileCourseId: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 30,
    });
    return items.map(summary);
  }
  async find(ownerId: string, id: string) {
    const item = await prisma.enrollmentPlan.findFirst({ where: { id, usuarioId: ownerId } });
    return item ? { ...summary(item), draft: draftSchema.parse(item.draft) } : null;
  }
  create(ownerId: string, profileCourseId: string, name: string, draft: PlannerDraft) {
    return prisma.$transaction(async transaction => {
      // Serialize the private quota, including concurrent browser tabs.
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`planner:${ownerId}`}))`;
      if ((await transaction.enrollmentPlan.count({ where: { usuarioId: ownerId } })) >= 30) {
        throw new Error("PLAN_QUOTA");
      }
      const item = await transaction.enrollmentPlan.create({
        data: {
          id: randomUUID(),
          usuarioId: ownerId,
          profileCourseId,
          name,
          semester: draft.semester,
          draft: draft as unknown as Prisma.InputJsonValue,
        },
      });
      return { ...summary(item), draft: draftSchema.parse(item.draft) };
    });
  }
  update(
    ownerId: string,
    id: string,
    expectedUpdatedAt: string,
    name: string,
    draft: PlannerDraft,
    profileCourseId: string
  ) {
    return prisma.$transaction(async transaction => {
      const updated = await transaction.enrollmentPlan.updateMany({
        where: { id, usuarioId: ownerId, updatedAt: new Date(expectedUpdatedAt) },
        data: {
          name,
          semester: draft.semester,
          profileCourseId,
          draft: draft as unknown as Prisma.InputJsonValue,
        },
      });
      if (!updated.count) {
        return null;
      }
      const item = await transaction.enrollmentPlan.findFirstOrThrow({
        where: { id, usuarioId: ownerId },
      });
      return { ...summary(item), draft: draftSchema.parse(item.draft) };
    });
  }
  async delete(ownerId: string, id: string) {
    return (
      (await prisma.enrollmentPlan.deleteMany({ where: { id, usuarioId: ownerId } })).count > 0
    );
  }
}
