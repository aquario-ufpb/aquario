#!/usr/bin/env node

/**
 * Build script that conditionally runs database migrations
 *
 * - If DATABASE_URL is set: runs migrations before build
 * - If DATABASE_URL is not set: skips migrations (frontend-only mode)
 * - Always builds the Next.js app
 */

const { execSync } = require("child_process");

const DATABASE_URL = process.env.DATABASE_URL;
const hasDatabase = !!DATABASE_URL;

console.log("🔨 Starting build process...\n");

// Step 1: Generate Prisma Client (always needed if Prisma is installed)
console.log("📦 Generating Prisma Client...");
try {
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("✅ Prisma Client generated\n");
} catch (_error) {
  console.warn("⚠️  Prisma generate failed (this is OK if not using Prisma)");
}

// Step 2: Run migrations if DATABASE_URL is set
if (hasDatabase) {
  console.log("🗄️  Database URL detected, running migrations...");
  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    console.log("✅ Migrations applied successfully\n");
  } catch (_error) {
    console.error("❌ Migration failed!");
    console.error("   Aborting build because the deployed schema may be incompatible.\n");
    process.exit(1);
  }
} else {
  console.log("⏭️  No DATABASE_URL set, skipping migrations (frontend-only mode)\n");
}

// Step 3: Build Next.js app
console.log("🏗️  Building Next.js app...");
try {
  execSync("next build", { stdio: "inherit" });
  console.log("\n✅ Build completed successfully!");
} catch (_error) {
  console.error("\n❌ Build failed!");
  process.exit(1);
}
