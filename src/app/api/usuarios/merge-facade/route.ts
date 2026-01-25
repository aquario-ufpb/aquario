import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { withAdmin } from "@/lib/server/services/auth/middleware";
import { mergeFacadeUser } from "@/lib/server/services/admin/merge-facade-user";

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

      const result = await mergeFacadeUser(data.facadeUserId, data.realUserId, data.deleteFacade);

      if (!result.success) {
        return NextResponse.json(
          { message: result.error || "Erro ao mesclar usuário facade" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        membershipsCopied: result.membershipsCopied,
        conflicts: result.conflicts,
        facadeUserDeleted: result.facadeUserDeleted,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { message: error.errors[0]?.message || "Dados inválidos" },
          { status: 400 }
        );
      }

      const message = error instanceof Error ? error.message : "Erro ao mesclar usuário facade";
      return NextResponse.json({ message }, { status: 400 });
    }
  });
}
