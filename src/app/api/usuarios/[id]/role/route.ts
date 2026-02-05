import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { withAdmin } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { ApiError, fromZodError } from "@/lib/server/errors";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateRoleSchema = z.object({
  papelPlataforma: z.enum(["USER", "MASTER_ADMIN"]),
});

export function PATCH(request: Request, context: RouteContext) {
  return withAdmin(request, async (req, currentUser) => {
    try {
      const { id } = await context.params;

      // Prevent self-demotion
      if (id === currentUser.id) {
        return ApiError.badRequest("Você não pode alterar seu próprio papel.");
      }

      const body = await req.json();
      const { papelPlataforma } = updateRoleSchema.parse(body);

      const { usuariosRepository } = getContainer();

      const usuario = await usuariosRepository.findById(id);
      if (!usuario) {
        return ApiError.userNotFound();
      }

      await usuariosRepository.updatePapelPlataforma(id, papelPlataforma);

      // Return updated user
      const updatedUser = await usuariosRepository.findById(id);
      if (!updatedUser) {
        return ApiError.internal("Erro ao buscar usuário atualizado.");
      }

      return NextResponse.json({
        id: updatedUser.id,
        nome: updatedUser.nome,
        email: updatedUser.email,
        papelPlataforma: updatedUser.papelPlataforma,
        eVerificado: updatedUser.eVerificado,
        urlFotoPerfil: updatedUser.urlFotoPerfil,
        centro: {
          id: updatedUser.centro.id,
          nome: updatedUser.centro.nome,
          sigla: updatedUser.centro.sigla,
        },
        curso: {
          id: updatedUser.curso.id,
          nome: updatedUser.curso.nome,
        },
        permissoes: updatedUser.permissoes,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fromZodError(error);
      }

      const message = error instanceof Error ? error.message : "Erro ao atualizar papel";
      return ApiError.badRequest(message);
    }
  });
}
