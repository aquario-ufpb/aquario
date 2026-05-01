import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { StatusProjeto } from "@prisma/client";
import { getContainer } from "@/lib/server/container";
import { updateProjetoSchema } from "@/lib/shared/validations/projetos";
import { ApiError, fromZodError } from "@/lib/server/errors";
import { SlugConflictError } from "@/lib/server/db/errors";
import { withAuth, canManageProjeto, getOptionalUser } from "@/lib/server/services/auth/middleware";

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

      // GC the old cover blob if urlImagem changed. Fire-and-forget — failure
      // here would leak a blob but shouldn't fail the user-facing update.
      // Triggers regardless of who originally uploaded the old blob, which is
      // why server-side cleanup matters: an entidade admin replacing a cover
      // uploaded by a co-admin can't delete it via the user-scoped DELETE.
      const oldUrl = existingProjeto.urlImagem;
      const newUrl = projeto.urlImagem;
      if (oldUrl && oldUrl !== newUrl) {
        const { blobStorage } = getContainer();
        blobStorage.delete(oldUrl).catch(err => {
          console.error("Failed to delete old cover blob", { url: oldUrl, err });
        });
      }

      return NextResponse.json(projeto);
    } catch (error) {
      // Race window: slugExists() above could pass, then a concurrent write
      // takes the new slug before we UPDATE. Repo translates Prisma's
      // unique-constraint error into a domain SlugConflictError.
      if (error instanceof SlugConflictError) {
        return ApiError.slugExists();
      }
      console.error("Error updating projeto:", error);
      return ApiError.internal("Erro ao atualizar projeto");
    }
  });
}
