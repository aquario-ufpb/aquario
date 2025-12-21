import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  return withAdmin(request, async (_req, currentUser) => {
    const { id } = await context.params;

    // Prevent self-deletion
    if (id === currentUser.id) {
      return NextResponse.json(
        { message: "Você não pode deletar sua própria conta." },
        { status: 400 }
      );
    }

    const { usuariosRepository } = getContainer();

    const usuario = await usuariosRepository.findById(id);
    if (!usuario) {
      return NextResponse.json({ message: "Usuário não encontrado." }, { status: 404 });
    }

    await usuariosRepository.delete(id);

    return NextResponse.json({ message: "Usuário deletado com sucesso." });
  });
}

