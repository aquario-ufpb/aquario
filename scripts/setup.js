#!/usr/bin/env node

/**
 * Unified setup script for Aquário
 *
 * Handles:
 * - Git submodules initialization/update
 * - Docker database setup
 * - Database migrations
 *
 * Safe to run multiple times - checks if things are already set up.
 */

const { execSync } = require("child_process");
const { existsSync, readFileSync } = require("fs");
const { join } = require("path");

const PROJECT_ROOT = join(__dirname, "..");

/**
 * Load environment variables from .env files
 * Follows Next.js precedence: .env.local > .env
 */
function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const envFile = readFileSync(filePath, "utf8");
  envFile.split("\n").forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").replace(/^["']|["']$/g, ""); // Remove quotes
        if (!process.env[key]) {
          // Only set if not already in environment (env vars take precedence)
          process.env[key] = value;
        }
      }
    }
  });
}

// Load .env files (Next.js precedence: .env.local overrides .env)
loadEnvFile(join(PROJECT_ROOT, ".env"));
loadEnvFile(join(PROJECT_ROOT, ".env.local"));

function exec(command, options = {}) {
  try {
    execSync(command, {
      cwd: PROJECT_ROOT,
      stdio: options.silent ? "pipe" : "inherit",
      ...options,
    });
    return true;
  } catch (_error) {
    return false;
  }
}

function checkCommand(command) {
  try {
    execSync(`which ${command}`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

console.log("🚀 Aquário Setup\n");
console.log("This will set up:");
console.log("  • Git submodules (content repositories)");
console.log("  • Docker database (if needed)");
console.log("  • Database migrations (if DATABASE_URL is set)");
console.log("");

// =============================================================================
// Step 1: Git Submodules
// =============================================================================
console.log("📦 Step 1: Setting up git submodules...");

if (!existsSync(join(PROJECT_ROOT, ".gitmodules"))) {
  console.log("   ⏭️  No .gitmodules found, skipping submodules\n");
} else {
  // Check if submodules are initialized
  const submodules = execSync("git config --file .gitmodules --get-regexp path", {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    stdio: "pipe",
  })
    .split("\n")
    .filter(Boolean)
    .map(line => line.split(" ")[1]);

  if (submodules.length === 0) {
    console.log("   ℹ️  No submodules found\n");
  } else {
    let needsInit = false;
    for (const submodule of submodules) {
      const submodulePath = join(PROJECT_ROOT, submodule);
      if (!existsSync(join(submodulePath, ".git"))) {
        needsInit = true;
        break;
      }
    }

    if (needsInit) {
      console.log("   📥 Initializing submodules...");
      exec("git submodule update --init --recursive");
      console.log("   ✅ Submodules initialized\n");
    } else {
      console.log("   ✅ Submodules already initialized");
      console.log("   🔄 Updating submodules to latest...");
      // Use the existing script for updates (it handles branch detection better)
      exec("bash scripts/setup-submodules.sh", { silent: true });
      console.log("   ✅ Submodules updated\n");
    }
  }
}

// =============================================================================
// Step 2: Docker Database
// =============================================================================
console.log("🐳 Step 2: Setting up Docker database...");

const DATABASE_URL = process.env.DATABASE_URL;
const hasDatabaseUrl = !!DATABASE_URL;

// Check if DATABASE_URL points to localhost/Docker
function isLocalDatabase(url) {
  if (!url) {
    return false;
  }
  // Check for localhost, 127.0.0.1, or docker container names
  return (
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("postgres:5432") ||
    url.match(/postgresql:\/\/.*@(localhost|127\.0\.0\.1|postgres):/)
  );
}

const isUsingLocalDatabase = hasDatabaseUrl && isLocalDatabase(DATABASE_URL);
const isUsingCloudDatabase = hasDatabaseUrl && !isLocalDatabase(DATABASE_URL);

if (isUsingCloudDatabase) {
  // Extract database provider from URL for better logging
  let provider = "cloud";
  if (DATABASE_URL.includes("neon.tech")) {
    provider = "Neon";
  } else if (DATABASE_URL.includes("supabase")) {
    provider = "Supabase";
  } else if (DATABASE_URL.includes("railway")) {
    provider = "Railway";
  } else if (DATABASE_URL.includes("vercel")) {
    provider = "Vercel Postgres";
  } else if (DATABASE_URL.includes("aws") || DATABASE_URL.includes("rds")) {
    provider = "AWS RDS";
  }

  console.log(`   ⏭️  Skipping Docker setup - using ${provider} database`);
  console.log(`   💡 DATABASE_URL points to cloud database, not local Docker\n`);
} else if (!hasDatabaseUrl) {
  console.log("   ℹ️  No DATABASE_URL set, checking for local Docker setup...");

  if (!checkCommand("docker")) {
    console.log("   ⚠️  Docker not found - skipping Docker setup");
    console.log(
      "   💡 Install Docker to use local database, or set DATABASE_URL for cloud database\n"
    );
  } else if (!existsSync(join(PROJECT_ROOT, "docker-compose.yml"))) {
    console.log("   ⏭️  No docker-compose.yml found\n");
  } else {
    // Check if container is already running
    try {
      const containerStatus = execSync(
        "docker ps --filter name=aquario-postgres --format '{{.Status}}'",
        {
          encoding: "utf8",
          stdio: "pipe",
        }
      ).trim();

      if (containerStatus) {
        console.log("   ✅ Docker database already running");
        console.log(`   📊 Status: ${containerStatus}\n`);
      } else {
        // Check if container exists but is stopped
        const exists = execSync(
          "docker ps -a --filter name=aquario-postgres --format '{{.Names}}'",
          {
            encoding: "utf8",
            stdio: "pipe",
          }
        ).trim();

        if (exists) {
          console.log("   🔄 Starting existing Docker container...");
          exec("docker-compose up -d");
          console.log("   ✅ Docker database started\n");
        } else {
          console.log("   🆕 Creating and starting Docker database...");
          exec("docker-compose up -d");
          console.log("   ✅ Docker database created and started\n");
        }
      }
    } catch (_error) {
      console.log("   ⚠️  Could not check Docker status, attempting to start...");
      exec("docker-compose up -d");
      console.log("   ✅ Docker database setup attempted\n");
    }
  }
} else if (isUsingLocalDatabase) {
  // DATABASE_URL points to localhost, so we should ensure Docker is running
  if (!checkCommand("docker")) {
    console.log("   ⚠️  Docker not found but DATABASE_URL points to localhost");
    console.log("   💡 Install Docker to use local database\n");
  } else if (!existsSync(join(PROJECT_ROOT, "docker-compose.yml"))) {
    console.log("   ⚠️  No docker-compose.yml found but DATABASE_URL points to localhost");
    console.log("   💡 Create docker-compose.yml or update DATABASE_URL\n");
  } else {
    // Check if container is already running
    try {
      const containerStatus = execSync(
        "docker ps --filter name=aquario-postgres --format '{{.Status}}'",
        {
          encoding: "utf8",
          stdio: "pipe",
        }
      ).trim();

      if (containerStatus) {
        console.log("   ✅ Docker database already running");
        console.log(`   📊 Status: ${containerStatus}\n`);
      } else {
        // Check if container exists but is stopped
        const exists = execSync(
          "docker ps -a --filter name=aquario-postgres --format '{{.Names}}'",
          {
            encoding: "utf8",
            stdio: "pipe",
          }
        ).trim();

        if (exists) {
          console.log("   🔄 Starting existing Docker container...");
          exec("docker-compose up -d");
          console.log("   ✅ Docker database started\n");
        } else {
          console.log("   🆕 Creating and starting Docker database...");
          exec("docker-compose up -d");
          console.log("   ✅ Docker database created and started\n");
        }
      }
    } catch (_error) {
      console.log("   ⚠️  Could not check Docker status, attempting to start...");
      exec("docker-compose up -d");
      console.log("   ✅ Docker database setup attempted\n");
    }
  }
}

// =============================================================================
// Step 3: Database Migrations
// =============================================================================
console.log("🗄️  Step 3: Running database migrations...");

if (!hasDatabaseUrl) {
  console.log("   ⏭️  No DATABASE_URL set, skipping migrations");
  console.log("   💡 Set DATABASE_URL in .env.local to run migrations\n");
} else {
  console.log("   🔍 DATABASE_URL detected, running migrations...");

  // Generate Prisma Client first
  console.log("   📦 Generating Prisma Client...");
  if (exec("npx prisma generate", { silent: true })) {
    console.log("   ✅ Prisma Client generated");
  } else {
    console.log("   ⚠️  Prisma generate failed (this is OK if not using Prisma)");
  }

  // Run migrations
  console.log("   🔄 Applying migrations...");
  try {
    const output = execSync("npx prisma migrate deploy", {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      stdio: "pipe",
    });
    console.log(output);
    console.log("   ✅ Migrations applied successfully\n");
  } catch (error) {
    // Capture both stdout and stderr (Prisma outputs errors to stderr)
    const stdout = (error.stdout || "").toString();
    const stderr = (error.stderr || "").toString();
    const errorStr = stdout + stderr;

    console.log("\n   ❌ Migration failed!");
    console.log("   Error details:");
    console.log(errorStr);

    // Provide specific guidance based on common errors
    if (errorStr.includes("No migration found")) {
      console.log("\n   💡 Issue: No migration files found in prisma/migrations");
      if (errorStr.includes("database schema is not empty")) {
        console.log("   💡 Your database already has tables but no migration history.");
        console.log("   💡 Solutions:");
        console.log(
          "      1. If this is a fresh database: Run 'npm run db:migrate' to create initial migration"
        );
        console.log(
          "      2. If database already has data: Run 'npx prisma migrate resolve --applied <migration-name>' to baseline"
        );
        console.log("      3. Or use 'npm run db:push' to sync schema without migrations");
      } else {
        console.log("   💡 Run 'npm run db:migrate' to create your first migration");
      }
    } else if (errorStr.includes("P1001") || errorStr.includes("Can't reach database")) {
      console.log("\n   💡 Issue: Cannot connect to database");
      console.log("   💡 Check your DATABASE_URL in .env.local");
      console.log("   💡 Make sure the database is running (Docker or cloud)");
    } else if (errorStr.includes("already applied")) {
      console.log("\n   ✅ This is OK - migrations are already up to date!");
    } else {
      console.log("\n   💡 Run 'npm run db:migrate' manually to see full error details");
    }
    console.log("");
  }
}

// =============================================================================
// Summary
// =============================================================================
console.log("✨ Setup complete!\n");
console.log("Next steps:");
console.log("  1. Run 'npm run dev' to start development");
console.log("  2. Access the app at http://localhost:3000\n");
