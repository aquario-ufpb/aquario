import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { withAdmin } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { ApiError, fromZodError } from "@/lib/server/errors";

const createFacadeUserSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  centroId: z.string().uuid("Centro inválido"),
  cursoId: z.string().uuid("Curso inválido"),
});

export async function POST(request: Request) {
  return await withAdmin(request, async () => {
    try {
      const body = await request.json();
      const data = createFacadeUserSchema.parse(body);

      const { usuariosRepository, centrosRepository, cursosRepository } = getContainer();

      // Validate centro
      const centro = await centrosRepository.findById(data.centroId);
      if (!centro) {
        return ApiError.notFound("Centro");
      }

      // Validate curso
      const curso = await cursosRepository.findById(data.cursoId);
      if (!curso) {
        return ApiError.notFound("Curso");
      }

      // Ensure curso belongs to the selected centro
      if (curso.centroId !== data.centroId) {
        return ApiError.badRequest("O curso selecionado não pertence ao centro informado.");
      }

      // Create facade user
      const usuario = await usuariosRepository.create({
        nome: data.nome,
        email: null,
        senhaHash: null,
        centroId: data.centroId,
        cursoId: data.cursoId,
        permissoes: [],
        papelPlataforma: "USER",
        eVerificado: false,
        eFacade: true,
        urlFotoPerfil: null,
        matricula: null,
      });

      return NextResponse.json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        papelPlataforma: usuario.papelPlataforma,
        eVerificado: usuario.eVerificado,
        eFacade: usuario.eFacade,
        urlFotoPerfil: usuario.urlFotoPerfil,
        centro: {
          id: usuario.centro.id,
          nome: usuario.centro.nome,
          sigla: usuario.centro.sigla,
        },
        curso: {
          id: usuario.curso.id,
          nome: usuario.curso.nome,
        },
        permissoes: usuario.permissoes,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fromZodError(error);
      }

      const message = error instanceof Error ? error.message : "Erro ao criar usuário facade";
      return ApiError.badRequest(message);
    }
  });
}
