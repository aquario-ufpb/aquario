#!/usr/bin/env node

/**
 * Safe release script that checks for remote changes before bumping version
 * Usage: node scripts/release.js [patch|minor|major]
 */

const { execSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const versionType = process.argv[2] || "patch";

if (!["patch", "minor", "major"].includes(versionType)) {
  console.error("❌ Invalid version type. Use: patch, minor, or major");
  process.exit(1);
}

function exec(command, options = {}) {
  const { silent, ignoreError, input, ...rest } = options;
  try {
    const execOptions = {
      encoding: "utf8",
      stdio: silent ? "pipe" : "inherit",
      ...rest,
    };
    if (input != null) {
      execOptions.input = input;
      if (silent) {
        execOptions.stdio = ["pipe", "pipe", "pipe"];
      }
    }
    const result = execSync(command, execOptions);
    return result ? result.trim() : "";
  } catch (error) {
    if (!ignoreError) {
      throw error;
    }
    return "";
  }
}

function checkGitStatus() {
  console.log("🔍 Checking git status...");

  // Check if there are uncommitted changes (ignore untracked files and submodule untracked content)
  const status = exec("git status --porcelain", { silent: true });
  if (!status) {
    console.log("✅ No uncommitted changes\n");
  } else {
    // Filter out:
    // - Untracked files (lines starting with ??)
    // - Submodules with only untracked content (check with git diff)
    const trackedChanges = status
      .split("\n")
      .filter(line => {
        if (!line || line.startsWith("??")) return false;

        // Check if it's a modified submodule
        if (line.trim().startsWith("M ")) {
          const file = line.substring(3).trim();
          // Check if submodule has actual commits (not just untracked content)
          const submoduleDiff = exec(`git diff ${file}`, { silent: true, ignoreError: true });
          // If diff is empty or null, it's just untracked content in the submodule
          if (!submoduleDiff) return false;
        }

        return true;
      })
      .join("\n");

    if (trackedChanges) {
      console.error(
        "❌ You have uncommitted changes to tracked files. Please commit or stash them first."
      );
      console.log(trackedChanges);
      process.exit(1);
    }
  }

  // Fetch latest from remote
  console.log("📥 Fetching latest changes from remote...");
  exec("git fetch");

  // Check if branch is behind remote
  const behind = exec("git rev-list HEAD..@{u} --count", {
    silent: true,
    ignoreError: true,
  });
  const behindCount = behind ? parseInt(behind, 10) : 0;
  if (behindCount > 0) {
    console.error("❌ Your branch is behind the remote. Please pull or rebase first.");
    console.log(`   Your branch is ${behindCount} commit(s) behind origin/main`);
    console.log("\n   Run: git pull --rebase origin main");
    process.exit(1);
  }

  // Check if branch is ahead of remote
  const ahead = exec("git rev-list @{u}..HEAD --count", {
    silent: true,
    ignoreError: true,
  });
  const aheadCount = ahead ? parseInt(ahead, 10) : 0;
  if (aheadCount > 0) {
    console.warn(`⚠️  Your branch is ${aheadCount} commit(s) ahead of origin/main`);
  }

  console.log("✅ Git status check passed\n");
}

function bumpVersion() {
  console.log(`📦 Bumping ${versionType} version...`);
  exec(`npm version ${versionType} -m 'chore(release): %s'`);
  const newVersion = exec("git describe --tags --abbrev=0", { silent: true });
  console.log(`✅ Version bumped to ${newVersion}\n`);
  return newVersion;
}

function pushChanges() {
  console.log("🚀 Pushing changes and tags...");
  exec("git push -u origin HEAD");
  exec("git push --tags");
  console.log("✅ Pushed successfully\n");
}

function getChangelogNotes(version) {
  const tag = version.replace(/^v/, "");
  const changelog = readFileSync(join(__dirname, "..", "CHANGELOG.md"), "utf8");
  const versionHeader = `## [${tag}]`;
  const start = changelog.indexOf(versionHeader);
  if (start === -1) return null;

  const contentStart = changelog.indexOf("\n", start) + 1;
  const nextVersion = changelog.indexOf("\n## [", contentStart);
  const section = nextVersion === -1
    ? changelog.substring(contentStart)
    : changelog.substring(contentStart, nextVersion);

  const trimmed = section.trim();
  return trimmed || null;
}

function createGitHubRelease(version) {
  console.log("📝 Creating GitHub release...");
  const changelog = getChangelogNotes(version);
  // Create with auto-generated notes first
  exec(`gh release create ${version} --generate-notes`, { silent: true });
  // Prepend changelog notes if available
  if (changelog) {
    const autoNotes = exec(`gh release view ${version} --json body -q .body`, { silent: true });
    const combined = `${changelog}\n\n---\n\n${autoNotes}`;
    exec(`gh release edit ${version} --notes-file -`, {
      silent: true,
      input: combined,
    });
  }
  const releaseUrl = exec(`gh release view ${version} --json url -q .url`, { silent: true });
  console.log(`✅ Release created: ${releaseUrl}\n`);
}

// Main execution
try {
  console.log("🚀 Starting release process...\n");

  checkGitStatus();
  const version = bumpVersion();
  pushChanges();
  createGitHubRelease(version);

  console.log("🎉 Release completed successfully!");
} catch (error) {
  console.error("\n❌ Release failed:", error.message);
  console.error("\n⚠️  Note: If version was already bumped, you may need to:");
  console.error("   1. git reset --hard HEAD~1  (to undo the version commit)");
  console.error("   2. git tag -d <tag-name>    (to delete the local tag)");
  process.exit(1);
}
