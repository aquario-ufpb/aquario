import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getContainer } from "@/lib/server/container";
import { updateProjetoAutoresSchema } from "@/lib/shared/validations/projetos";
import { ApiError, fromZodError } from "@/lib/server/errors";
import { withAuth, canManageProjeto } from "@/lib/server/services/auth/middleware";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

/**
 * PUT /api/projetos/[slug]/autores — authenticated; replaces the full author list.
 *
 * Caller must be allowed to manage the existing projeto AND the new author set
 * (i.e. cannot bypass permissions by attributing the project to entidades they
 * don't admin).
 */
export function PUT(request: NextRequest, context: RouteContext) {
  return withAuth(request, async (req, usuario) => {
    try {
      const { slug } = await context.params;
      const body = await req.json();

      const validation = updateProjetoAutoresSchema.safeParse(body);
      if (!validation.success) {
        return fromZodError(validation.error);
      }

      const { autores } = validation.data;
      const { projetosRepository } = getContainer();

      const projeto = await projetosRepository.findBySlugWithAutores(slug);
      if (!projeto) {
        return ApiError.notFound("Projeto");
      }

      if (!(await canManageProjeto(usuario, projeto.autores))) {
        return ApiError.forbidden("Você não tem permissão para alterar autores deste projeto.");
      }

      // Permission must also hold for the *new* author set — prevents handing
      // a projeto off to entidades you don't admin (or removing yourself from
      // the principal slot in a way that locks others in).
      if (
        !(await canManageProjeto(
          usuario,
          autores.map(a => ({
            usuarioId: a.usuarioId ?? null,
            entidadeId: a.entidadeId ?? null,
            autorPrincipal: a.autorPrincipal,
          }))
        ))
      ) {
        return ApiError.forbidden(
          "Você não tem permissão para atribuir o projeto a esses autores."
        );
      }

      const usuarioIds = autores.map(a => a.usuarioId).filter((id): id is string => !!id);
      const entidadeIds = autores.map(a => a.entidadeId).filter((id): id is string => !!id);

      if (!(await projetosRepository.usuariosExist(usuarioIds))) {
        return ApiError.badRequest("Um ou mais usuários não existem");
      }
      if (!(await projetosRepository.entidadesExist(entidadeIds))) {
        return ApiError.badRequest("Uma ou mais entidades não existem");
      }

      const updatedProjeto = await projetosRepository.replaceAutores(projeto.id, slug, autores);
      return NextResponse.json(updatedProjeto);
    } catch (error) {
      console.error("Error updating projeto autores:", error);
      return ApiError.internal("Erro ao atualizar autores do projeto");
    }
  });
}
