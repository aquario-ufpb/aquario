import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAdmin } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateUserInfoSchema = z.object({
  centroId: z.string().optional(),
  cursoId: z.string().optional(),
});

export function PATCH(request: Request, context: RouteContext) {
  return withAdmin(request, async req => {
    const { id } = await context.params;

    const { usuariosRepository, centrosRepository, cursosRepository } = getContainer();

    const usuario = await usuariosRepository.findById(id);
    if (!usuario) {
      return NextResponse.json({ message: "Usuário não encontrado." }, { status: 404 });
    }

    const body = await req.json();
    const result = updateUserInfoSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Dados inválidos.", errors: result.error },
        {
          status: 400,
        }
      );
    }

    const { centroId, cursoId } = result.data;

    // Validate centro exists if provided
    if (centroId) {
      const centro = await centrosRepository.findById(centroId);
      if (!centro) {
        return NextResponse.json({ message: "Centro não encontrado." }, { status: 404 });
      }
    }

    // Validate curso exists if provided
    if (cursoId) {
      const curso = await cursosRepository.findById(cursoId);
      if (!curso) {
        return NextResponse.json({ message: "Curso não encontrado." }, { status: 404 });
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
    return NextResponse.json(updatedUser);
  });
}
