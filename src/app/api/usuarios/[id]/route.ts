import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAdmin } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";
import { recordAuditLog } from "@/lib/server/services/audit-log";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function DELETE(request: Request, context: RouteContext) {
  return withAdmin(request, async (_req, currentUser) => {
    try {
      const { id } = await context.params;

      // Prevent self-deletion
      if (id === currentUser.id) {
        return ApiError.badRequest("Você não pode deletar sua própria conta.");
      }

      const { usuariosRepository } = getContainer();

      const usuario = await usuariosRepository.findById(id);
      if (!usuario) {
        return ApiError.userNotFound();
      }

      await usuariosRepository.delete(id);

      await recordAuditLog(_req, currentUser, {
        action: "usuario.deleted",
        resourceType: "usuario",
        resourceId: id,
        metadata: {
          targetUserName: usuario.nome,
          targetUserEmail: usuario.email,
          targetUserWasFacade: usuario.eFacade,
        },
      });

      return NextResponse.json({ message: "Usuário deletado com sucesso." });
    } catch {
      return ApiError.internal("Erro ao deletar usuário");
    }
  });
}
