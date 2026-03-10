import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { updateProjetoAutoresSchema } from "@/lib/shared/validations/projeto";
import { ApiError, fromZodError } from "@/lib/server/errors/api-error";

/**
 * PUT /api/projetos/[slug]/autores
 * Atualiza os autores de um projeto (substitui todos)
 */
export async function PUT(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    const body = await request.json();

    const validation = updateProjetoAutoresSchema.safeParse(body);

    if (!validation.success) {
      return fromZodError(validation.error);
    }

    const { autores } = validation.data;
    const { projetosRepository } = getContainer();

    // Check if projeto exists
    const projeto = await projetosRepository.findBySlugBasic(slug);

    if (!projeto) {
      return ApiError.notFound("Projeto");
    }

    // Verify all usuarios exist
    const usuarioIds = autores.map(a => a.usuarioId);
    if (!(await projetosRepository.usuariosExist(usuarioIds))) {
      return ApiError.badRequest("Um ou mais usuários não existem");
    }

    // Replace all autores
    const updatedProjeto = await projetosRepository.replaceAutores(projeto.id, slug, autores);

    return NextResponse.json(updatedProjeto);
  } catch (error) {
    console.error("Error updating projeto autores:", error);
    return ApiError.internal("Erro ao atualizar autores do projeto");
  }
}
