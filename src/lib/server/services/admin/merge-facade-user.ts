import { prisma } from "@/lib/server/db/prisma";

/**
 * Merge a facade user's memberships into a real user account
 *
 * This function:
 * 1. Copies all MembroEntidade records from facade user to real user
 * 2. Handles conflicts (if real user already has membership in same entity)
 * 3. Optionally deletes the facade user after merging
 *
 * @param facadeUserId - ID of the facade user to merge from
 * @param realUserId - ID of the real user to merge into
 * @param deleteFacade - Whether to delete the facade user after merging (default: true)
 * @returns Summary of the merge operation
 */
export async function mergeFacadeUser(
  facadeUserId: string,
  realUserId: string,
  deleteFacade: boolean = true
): Promise<{
  success: boolean;
  membershipsCopied: number;
  conflicts: number;
  facadeUserDeleted: boolean;
  error?: string;
}> {
  try {
    // Verify facade user exists and is actually a facade
    const facadeUser = await prisma.usuario.findUnique({
      where: { id: facadeUserId },
      include: { membroDeEntidades: { include: { cargo: true } } },
    });

    if (!facadeUser) {
      return {
        success: false,
        membershipsCopied: 0,
        conflicts: 0,
        facadeUserDeleted: false,
        error: "Facade user not found",
      };
    }

    if (!facadeUser.eFacade) {
      return {
        success: false,
        membershipsCopied: 0,
        conflicts: 0,
        facadeUserDeleted: false,
        error: "User is not a facade user",
      };
    }

    // Verify real user exists
    const realUser = await prisma.usuario.findUnique({
      where: { id: realUserId },
      include: { membroDeEntidades: true },
    });

    if (!realUser) {
      return {
        success: false,
        membershipsCopied: 0,
        conflicts: 0,
        facadeUserDeleted: false,
        error: "Real user not found",
      };
    }

    if (realUser.eFacade) {
      return {
        success: false,
        membershipsCopied: 0,
        conflicts: 0,
        facadeUserDeleted: false,
        error: "Target user is a facade user",
      };
    }

    // Get existing memberships for real user to check conflicts
    const realUserEntidadeIds = new Set(
      realUser.membroDeEntidades.map((m: { entidadeId: string }) => m.entidadeId)
    );

    let membershipsCopied = 0;
    let conflicts = 0;

    // Copy memberships from facade to real user
    for (const facadeMembership of facadeUser.membroDeEntidades) {
      // Check if real user already has membership in this entity
      if (realUserEntidadeIds.has(facadeMembership.entidadeId)) {
        conflicts++;
        continue;
      }

      // Copy the membership, updating usuarioId to real user
      await prisma.membroEntidade.create({
        data: {
          usuarioId: realUserId,
          entidadeId: facadeMembership.entidadeId,
          papel: facadeMembership.papel,
          cargoId: facadeMembership.cargoId,
          startedAt: facadeMembership.startedAt,
          endedAt: facadeMembership.endedAt,
        },
      });

      membershipsCopied++;
    }

    // Delete facade user if requested
    let facadeUserDeleted = false;
    if (deleteFacade) {
      // Delete all memberships for the facade user first (to avoid foreign key constraint)
      await prisma.membroEntidade.deleteMany({
        where: { usuarioId: facadeUserId },
      });

      // Now delete the facade user
      await prisma.usuario.delete({
        where: { id: facadeUserId },
      });
      facadeUserDeleted = true;
    }

    return {
      success: true,
      membershipsCopied,
      conflicts,
      facadeUserDeleted,
    };
  } catch (error) {
    return {
      success: false,
      membershipsCopied: 0,
      conflicts: 0,
      facadeUserDeleted: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
