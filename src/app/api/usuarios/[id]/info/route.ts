import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAdmin } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { z } from "zod";
import { ApiError, fromZodError } from "@/lib/server/errors";
import { updateUserInfoSchema } from "@/lib/server/api-schemas/usuarios";
import { recordAuditLog } from "@/lib/server/services/audit-log";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export function PATCH(request: Request, context: RouteContext) {
  return withAdmin(request, async (req, currentUser) => {
    try {
      const { id } = await context.params;

      const { usuariosRepository, centrosRepository, cursosRepository } = getContainer();

      const usuario = await usuariosRepository.findById(id);
      if (!usuario) {
        return ApiError.userNotFound();
      }

      const body = await req.json();
      const { centroId, cursoId } = updateUserInfoSchema.parse(body);

      // Validate centro exists if provided
      if (centroId) {
        const centro = await centrosRepository.findById(centroId);
        if (!centro) {
          return ApiError.notFound("Centro");
        }
      }

      // Validate curso exists if provided
      if (cursoId) {
        const curso = await cursosRepository.findById(cursoId);
        if (!curso) {
          return ApiError.notFound("Curso");
        }
      }

      // Update user
      if (centroId) {
        await usuariosRepository.updateCentro(id, centroId);
      }
      if (cursoId) {
        await usuariosRepository.updateCurso(id, cursoId);
      }

      // Fetch updated user
      const updatedUser = await usuariosRepository.findById(id);
      await recordAuditLog(req, currentUser, {
        action: "usuario.info.updated",
        resourceType: "usuario",
        resourceId: id,
        metadata: {
          targetUserName: usuario.nome,
          previousCentroId: usuario.centro.id,
          newCentroId: updatedUser?.centro.id ?? centroId ?? usuario.centro.id,
          previousCursoId: usuario.curso.id,
          newCursoId: updatedUser?.curso.id ?? cursoId ?? usuario.curso.id,
        },
      });

      return NextResponse.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fromZodError(error);
      }
      return ApiError.internal("Erro ao atualizar informações do usuário");
    }
  });
}
