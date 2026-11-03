import { NextRequest, NextResponse, after } from "next/server";
import { notificarNovoProjeto } from "@/lib/server/services/push/notificacoes";
export const dynamic = "force-dynamic";
import { getContainer } from "@/lib/server/container";
import { StatusProjeto } from "@prisma/client";
import { ApiError } from "@/lib/server/errors";
import { withAuth, canManageProjeto } from "@/lib/server/services/auth/middleware";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

/**
 * POST /api/projetos/[slug]/publish — authenticated; flips RASCUNHO → PUBLICADO.
 */
export function POST(request: NextRequest, context: RouteContext) {
  return withAuth(request, async (_req, usuario) => {
    try {
      const { slug } = await context.params;
      const { projetosRepository } = getContainer();

      const projeto = await projetosRepository.findBySlugWithAutores(slug);
      if (!projeto) {
        return ApiError.notFound("Projeto");
      }

      if (!(await canManageProjeto(usuario, projeto.autores))) {
        return ApiError.forbidden("Você não tem permissão para publicar este projeto.");
      }

      if (projeto.status === StatusProjeto.PUBLICADO) {
        return ApiError.badRequest("Projeto já está publicado");
      }

      if (!projeto.titulo) {
        return ApiError.badRequest("Projeto deve ter título para ser publicado");
      }

      if (projeto.autores.length === 0) {
        return ApiError.badRequest("Projeto deve ter pelo menos um autor para ser publicado");
      }

      const updatedProjeto = await projetosRepository.updateStatus(
        slug,
        StatusProjeto.PUBLICADO,
        new Date()
      );

      // Só na primeira publicação (despublicar e publicar de novo não repete o aviso) e só para
      // projetos de entidade: a categoria do app é "novidades das entidades".
      const entidadeId = projeto.autores.find(
        autor => autor.autorPrincipal && autor.entidadeId
      )?.entidadeId;
      if (!projeto.publicadoEm && entidadeId) {
        after(() =>
          getContainer()
            .entidadesRepository.findById(entidadeId)
            .then(entidade => entidade && notificarNovoProjeto(projeto, entidade.nome))
            .catch(() => undefined)
        );
      }

      return NextResponse.json(updatedProjeto);
    } catch (error) {
      console.error("Error publishing projeto:", error);
      return ApiError.internal("Erro ao publicar projeto");
    }
  });
}

/**
 * DELETE /api/projetos/[slug]/publish — authenticated; flips PUBLICADO → RASCUNHO.
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
        return ApiError.forbidden("Você não tem permissão para despublicar este projeto.");
      }

      if (projeto.status !== StatusProjeto.PUBLICADO) {
        return ApiError.badRequest("Projeto não está publicado");
      }

      const updatedProjeto = await projetosRepository.updateStatus(
        slug,
        StatusProjeto.RASCUNHO,
        null
      );

      return NextResponse.json(updatedProjeto);
    } catch (error) {
      console.error("Error unpublishing projeto:", error);
      return ApiError.internal("Erro ao despublicar projeto");
    }
  });
}
