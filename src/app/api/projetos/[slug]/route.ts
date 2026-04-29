import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { updateProjetoSchema } from "@/lib/shared/validations/projeto";
import { ApiError, fromZodError } from "@/lib/server/errors/api-error";
import { withAuth, canManageProjeto } from "@/lib/server/services/auth/middleware";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

/**
 * GET /api/projetos/[slug] — public.
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
 * PATCH /api/projetos/[slug] — authenticated, only autores or entidade-admins.
 */
export function PATCH(request: NextRequest, context: RouteContext) {
  return withAuth(request, async (req, usuario) => {
    try {
      const { slug } = await context.params;
      const body = await req.json();

      const validation = updateProjetoSchema.safeParse(body);
      if (!validation.success) {
        return fromZodError(validation.error);
      }

      const data = validation.data;
      const { projetosRepository } = getContainer();

      const existingProjeto = await projetosRepository.findBySlugWithAutores(slug);
      if (!existingProjeto) {
        return ApiError.notFound("Projeto");
      }

      if (!(await canManageProjeto(usuario, existingProjeto.autores))) {
        return ApiError.forbidden("Você não tem permissão para editar este projeto.");
      }

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
  });
}

/**
 * DELETE /api/projetos/[slug] — authenticated, only autores or entidade-admins.
 */
export function DELETE(request: NextRequest, context: RouteContext) {
  return withAuth(request, async (_req, usuario) => {
    try {
      const { slug } = await context.params;
      const { projetosRepository } = getContainer();

      const projeto = await projetosRepository.findBySlugWithAutores(slug);
      if (!projeto) {
        return ApiError.notFound("Projeto");
      }

      if (!(await canManageProjeto(usuario, projeto.autores))) {
        return ApiError.forbidden("Você não tem permissão para remover este projeto.");
      }

      await projetosRepository.delete(slug);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error deleting projeto:", error);
      return ApiError.internal("Erro ao remover projeto");
    }
  });
}
