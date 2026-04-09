import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { updateProjetoSchema } from "@/lib/shared/validations/projeto";
import { ApiError, fromZodError } from "@/lib/server/errors/api-error";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

/**
 * GET /api/projetos/[slug]
 * Obtém detalhes de um projeto específico pelo slug
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const { projetosRepository } = getContainer();

    const projeto = await projetosRepository.findBySlug(slug);

    if (!projeto) {
      return ApiError.notFound("Projeto");
    }

    return NextResponse.json(projeto);
  } catch (error) {
    console.error("Error fetching projeto:", error);
    return ApiError.internal("Erro ao buscar projeto");
  }
}

/**
 * PATCH /api/projetos/[slug]
 * Atualiza um projeto (não atualiza autores)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const body = await request.json();

    const validation = updateProjetoSchema.safeParse(body);

    if (!validation.success) {
      return fromZodError(validation.error);
    }

    const data = validation.data;
    const { projetosRepository } = getContainer();

    // Check if projeto exists
    const existingProjeto = await projetosRepository.findBySlugBasic(slug);

    if (!existingProjeto) {
      return ApiError.notFound("Projeto");
    }

    // Check if new slug already exists (if changing slug)
    if (data.slug && data.slug !== slug) {
      if (await projetosRepository.slugExists(data.slug)) {
        return ApiError.slugExists();
      }
    }

    const projeto = await projetosRepository.update(slug, data);

    return NextResponse.json(projeto);
  } catch (error) {
    console.error("Error updating projeto:", error);
    return ApiError.internal("Erro ao atualizar projeto");
  }
}

/**
 * DELETE /api/projetos/[slug]
 * Remove um projeto
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const { projetosRepository } = getContainer();

    // Check if projeto exists
    const projeto = await projetosRepository.findBySlugBasic(slug);

    if (!projeto) {
      return ApiError.notFound("Projeto");
    }

    // Delete projeto (cascade will delete ProjetoAutor relations)
    await projetosRepository.delete(slug);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting projeto:", error);
    return ApiError.internal("Erro ao remover projeto");
  }
}
