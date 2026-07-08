import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { withAdmin } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { ApiError, fromZodError } from "@/lib/server/errors";
import { updateSlugSchema } from "@/lib/server/api-schemas/usuarios";
import { recordAuditLog } from "@/lib/server/services/audit-log";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function PATCH(request: Request, context: RouteContext) {
  return withAdmin(request, async (req, currentUser) => {
    try {
      const { id } = await context.params;
      const body = await req.json();
      const data = updateSlugSchema.parse(body);

      const { usuariosRepository } = getContainer();
      const usuario = await usuariosRepository.findById(id);
      if (!usuario) {
        return ApiError.userNotFound();
      }

      // Normalize slug: empty string becomes null, trim whitespace, lowercase
      const normalizedSlug = data.slug?.trim().toLowerCase() || null;

      await usuariosRepository.updateSlug(id, normalizedSlug);

      // Fetch updated user
      const updatedUser = await usuariosRepository.findById(id);
      await recordAuditLog(req, currentUser, {
        action: "usuario.slug.updated",
        resourceType: "usuario",
        resourceId: id,
        metadata: {
          targetUserName: usuario.nome,
          previousSlug: usuario.slug,
          newSlug: updatedUser?.slug ?? normalizedSlug,
        },
      });

      return NextResponse.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fromZodError(error);
      }

      const message = error instanceof Error ? error.message : "Erro ao atualizar slug";
      return ApiError.badRequest(message);
    }
  });
}
