// @vitest-environment node
import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

// Explicit disposable PostgreSQL only; never infer permission from DATABASE_URL.
const databaseUrl = process.env.PLANNER_TEST_DATABASE_URL;
const databaseTests = databaseUrl ? describe : describe.skip;
databaseTests("distributed public offering request limits", () => {
  it("admits exactly the budget under concurrent requests across repository instances and resets expired buckets", async () => {
    if (!databaseUrl) {
      throw new Error("Disposable database required");
    }
    const parsed = new URL(databaseUrl);
    if (
      !["localhost", "127.0.0.1"].includes(parsed.hostname) ||
      !/^aquario_(?:sigaa|planner)_test(?:_[a-z0-9]+)?$/.test(parsed.pathname.slice(1))
    ) {
      throw new Error("Refusing rate-limit test outside a local disposable aquario test database");
    }
    process.env.DATABASE_URL = databaseUrl;
    const { PrismaPublicOfferingCacheRepository } =
      await import("../prisma-public-offering-cache-repository");
    const { prisma: sharedPrisma } = await import("@/lib/server/db/prisma");
    const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    const key = `offering:test:${randomUUID()}`;
    const other = `${key}:other`;
    const repositories = [
      new PrismaPublicOfferingCacheRepository(),
      new PrismaPublicOfferingCacheRepository(),
    ];
    try {
      const outcomes = await Promise.all(
        Array.from({ length: 70 }, (_, index) =>
          repositories[index % 2].consumeRequest(key, 40, 60000)
        )
      );
      expect(outcomes.filter(Boolean)).toHaveLength(40);
      expect(outcomes.filter(value => !value)).toHaveLength(30);
      expect(await repositories[0].consumeRequest(key, 40, 60000)).toBe(false);
      expect(await repositories[1].consumeRequest(other, 3, 60000)).toBe(true);
      const rows = await db.$queryRaw<
        { count: number }[]
      >`SELECT "count" FROM "PublicOfferingRequestLimit" WHERE "key" = ${key}`;
      expect(rows[0].count).toBe(40);
      await db.$executeRaw`UPDATE "PublicOfferingRequestLimit" SET "expiresAt" = CURRENT_TIMESTAMP - INTERVAL '1 second' WHERE "key" = ${key}`;
      const reset = await Promise.all(
        Array.from({ length: 8 }, (_, index) =>
          repositories[index % 2].consumeRequest(key, 3, 60000)
        )
      );
      expect(reset.filter(Boolean)).toHaveLength(3);
      const resetRows = await db.$queryRaw<
        { count: number; expiresAt: Date }[]
      >`SELECT "count", "expiresAt" FROM "PublicOfferingRequestLimit" WHERE "key" = ${key}`;
      expect(resetRows[0].count).toBe(3);
      expect(resetRows[0].expiresAt.getTime()).toBeGreaterThan(Date.now());
    } finally {
      await db.$executeRaw`DELETE FROM "PublicOfferingRequestLimit" WHERE "key" IN (${key}, ${other})`;
      await db.$disconnect();
      await sharedPrisma.$disconnect();
    }
  });
});
