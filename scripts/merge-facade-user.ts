#!/usr/bin/env tsx

/**
 * CLI script to merge a facade user's memberships into a real user account
 *
 * Usage:
 *   npm run merge-facade-user <facadeUserId> <realUserId> [--keep-facade]
 *
 * Example:
 *   npm run merge-facade-user abc123 def456
 *   npm run merge-facade-user abc123 def456 --keep-facade
 */

import { mergeFacadeUser } from "../src/lib/server/services/admin/merge-facade-user";

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: merge-facade-user <facadeUserId> <realUserId> [--keep-facade]");
    console.error("");
    console.error("Arguments:");
    console.error("  facadeUserId  - ID of the facade user to merge from");
    console.error("  realUserId    - ID of the real user to merge into");
    console.error("  --keep-facade - Keep the facade user after merging (default: deletes it)");
    process.exit(1);
  }

  const [facadeUserId, realUserId] = args;
  const keepFacade = args.includes("--keep-facade");

  console.log("Merging facade user...");
  console.log(`  Facade User ID: ${facadeUserId}`);
  console.log(`  Real User ID: ${realUserId}`);
  console.log(`  Delete facade after merge: ${!keepFacade}`);
  console.log("");

  const result = await mergeFacadeUser(facadeUserId, realUserId, !keepFacade);

  if (result.success) {
    console.log("✅ Merge completed successfully!");
    console.log(`   Memberships copied: ${result.membershipsCopied}`);
    if (result.conflicts > 0) {
      console.log(`   Conflicts (skipped): ${result.conflicts}`);
    }
    if (result.facadeUserDeleted) {
      console.log("   Facade user deleted");
    } else {
      console.log("   Facade user kept");
    }
  } else {
    console.error("❌ Merge failed!");
    console.error(`   Error: ${result.error}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
