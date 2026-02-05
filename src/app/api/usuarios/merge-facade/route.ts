import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { withAdmin } from "@/lib/server/services/auth/middleware";
import { mergeFacadeUser } from "@/lib/server/services/admin/merge-facade-user";
import { getContainer } from "@/lib/server/container";
import { ApiError, fromZodError } from "@/lib/server/errors";

const mergeFacadeUserSchema = z.object({
  facadeUserId: z.string().uuid("ID de usuário facade inválido"),
  realUserId: z.string().uuid("ID de usuário real inválido"),
  deleteFacade: z.boolean().default(true),
});

export async function POST(request: Request) {
  return await withAdmin(request, async () => {
    try {
      const body = await request.json();
      const data = mergeFacadeUserSchema.parse(body);

      const { usuariosRepository, membrosRepository } = getContainer();
      const result = await mergeFacadeUser(data.facadeUserId, data.realUserId, data.deleteFacade, {
        usuariosRepository,
        membrosRepository,
      });

      if (!result.success) {
        return ApiError.badRequest(result.error || "Erro ao mesclar usuário facade");
      }

      return NextResponse.json({
        success: true,
        membershipsCopied: result.membershipsCopied,
        conflicts: result.conflicts,
        facadeUserDeleted: result.facadeUserDeleted,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fromZodError(error);
      }

      const message = error instanceof Error ? error.message : "Erro ao mesclar usuário facade";
      return ApiError.badRequest(message);
    }
  });
}
