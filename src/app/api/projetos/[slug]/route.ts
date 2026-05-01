import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getContainer } from "@/lib/server/container";
import { updateProjetoSchema } from "@/lib/shared/validations/projetos";
import { ApiError, fromZodError } from "@/lib/server/errors";
import { withAuth, canManageProjeto, getOptionalUser } from "@/lib/server/services/auth/middleware";
import { StatusProjeto } from "@prisma/client";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

/**
 * GET /api/projetos/[slug]
 * - PUBLICADO projects are public.
 * - RASCUNHO / ARQUIVADO projects require an authenticated MASTER_ADMIN or
 *   someone listed as autor / entidade-admin (canManageProjeto).
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const { projetosRepository } = getContainer();

    const projeto = await projetosRepository.findBySlug(slug);

    if (!projeto) {
      return ApiError.notFound("Projeto");
    }

    if (projeto.status !== "PUBLICADO") {
      const user = await getOptionalUser(request);
      if (!user) {
        return ApiError.notFound("Projeto");
      }
      if (
        user.papelPlataforma !== "MASTER_ADMIN" &&
        !(await canManageProjeto(user, projeto.autores))
      ) {
        return ApiError.notFound("Projeto");
      }
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

      // Status transitions have semantics beyond a plain field write —
      // PUBLICADO needs readiness checks (matching /publish) and tracks
      // publicadoEm. Apply that here so PATCH can't be used to bypass /publish.
      const targetStatus = data.status as StatusProjeto | undefined;
      if (targetStatus && targetStatus !== existingProjeto.status) {
        if (targetStatus === StatusProjeto.PUBLICADO) {
          // Use the patched titulo if provided, otherwise the stored one.
          const effectiveTitulo = data.titulo ?? existingProjeto.titulo;
          if (!effectiveTitulo) {
            return ApiError.badRequest("Projeto deve ter título para ser publicado");
          }
          if (existingProjeto.autores.length === 0) {
            return ApiError.badRequest("Projeto deve ter pelo menos um autor para ser publicado");
          }
          // Cast lets the Prisma update accept the extra publicadoEm field —
          // /publish keeps owning the dedicated fast-path; this is the bypass guard.
          (data as Record<string, unknown>).publicadoEm = new Date();
        } else if (existingProjeto.status === StatusProjeto.PUBLICADO) {
          // Leaving PUBLICADO (→ ARQUIVADO or RASCUNHO) clears publicadoEm
          // so re-publishing later resets the timestamp.
          (data as Record<string, unknown>).publicadoEm = null;
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
