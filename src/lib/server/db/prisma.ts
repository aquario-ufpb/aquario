import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client singleton
 *
 * In development, Next.js hot reloading can cause multiple instances.
 * We store the client in globalThis to prevent this.
 *
 * In production, this is a simple singleton.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

