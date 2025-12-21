import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateRoleSchema = z.object({
  papelPlataforma: z.enum(["USER", "MASTER_ADMIN"]),
});

export function PATCH(request: Request, context: RouteContext) {
  return withAdmin(request, async (req, currentUser) => {
    const { id } = await context.params;

    // Prevent self-demotion
    if (id === currentUser.id) {
      return NextResponse.json(
        { message: "Você não pode alterar seu próprio papel." },
        { status: 400 }
      );
    }

    try {
      const body = await req.json();
      const { papelPlataforma } = updateRoleSchema.parse(body);

      const { usuariosRepository } = getContainer();

      const usuario = await usuariosRepository.findById(id);
      if (!usuario) {
        return NextResponse.json({ message: "Usuário não encontrado." }, { status: 404 });
      }

      await usuariosRepository.updatePapelPlataforma(id, papelPlataforma);

      // Return updated user
      const updatedUser = await usuariosRepository.findById(id);
      if (!updatedUser) {
        return NextResponse.json(
          { message: "Erro ao buscar usuário atualizado." },
          { status: 500 }
        );
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
        return NextResponse.json(
          { message: error.errors[0]?.message || "Dados inválidos" },
          { status: 400 }
        );
      }

      const message = error instanceof Error ? error.message : "Erro ao atualizar papel";
      return NextResponse.json({ message }, { status: 400 });
    }
  });
}
