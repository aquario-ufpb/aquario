import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { emptyDraft } from "@/lib/shared/planner/types";

// Run only against an explicitly supplied disposable database with migrations applied.
const databaseUrl = process.env.PLANNER_TEST_DATABASE_URL;
const testDatabase = databaseUrl ? describe : describe.skip;
testDatabase("private enrollment plans in PostgreSQL", () => {
  it("isolates owners, rejects stale updates, cascades and never writes enrollments", async () => {
    if (!databaseUrl) {
      throw new Error("Disposable database required");
    }
    process.env.DATABASE_URL = databaseUrl;
    // Import only after selecting the disposable database; the repository shares a Prisma singleton.
    const { PrismaEnrollmentPlanRepository } =
      await import("@/lib/server/db/implementations/prisma/prisma-enrollment-plan-repository");
    const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    const suffix = randomUUID();
    const campus = await db.campus.create({ data: { nome: `Planner ${suffix}` } });
    const center = await db.centro.create({
      data: { nome: `Planner ${suffix}`, sigla: `P${suffix.slice(0, 6)}`, campusId: campus.id },
    });
    const course = await db.curso.create({
      data: { nome: `Planner ${suffix}`, centroId: center.id },
    });
    const a = await db.usuario.create({
      data: { nome: "Owner", cursoId: course.id, centroId: center.id },
    });
    const b = await db.usuario.create({
      data: { nome: "Other", cursoId: course.id, centroId: center.id },
    });
    const repository = new PrismaEnrollmentPlanRepository();
    try {
      const plan = await repository.create(a.id, course.id, "A", emptyDraft("2026.2"));
      expect(await repository.list(b.id)).toEqual([]);
      expect(await repository.find(b.id, plan.id)).toBeNull();
      expect(await repository.delete(b.id, plan.id)).toBe(false);
      const updated = await repository.update(
        a.id,
        plan.id,
        plan.updatedAt,
        "B",
        emptyDraft("2026.2"),
        course.id
      );
      expect(updated?.name).toBe("B");
      expect(
        await repository.update(
          a.id,
          plan.id,
          plan.updatedAt,
          "stale",
          emptyDraft("2026.2"),
          course.id
        )
      ).toBeNull();
      expect(await db.disciplinaSemestre.count({ where: { usuarioId: a.id } })).toBe(0);
      expect(await db.disciplinaConcluida.count({ where: { usuarioId: a.id } })).toBe(0);
      expect(Object.keys(updated ?? {})).not.toContain("usuarioId");
      await db.usuario.delete({ where: { id: a.id } });
      expect(await repository.find(a.id, plan.id)).toBeNull();
    } finally {
      await db.usuario.deleteMany({ where: { id: { in: [a.id, b.id] } } });
      await db.curso.delete({ where: { id: course.id } });
      await db.centro.delete({ where: { id: center.id } });
      await db.campus.delete({ where: { id: campus.id } });
      await db.$disconnect();
    }
  });
});
