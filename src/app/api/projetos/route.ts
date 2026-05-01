import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getContainer } from "@/lib/server/container";
import { createProjetoSchema, listProjetosSchema } from "@/lib/shared/validations/projetos";
import { ApiError, fromZodError } from "@/lib/server/errors";
import {
  withAuth,
  canManageVagaForEntidade,
  getOptionalUser,
} from "@/lib/server/services/auth/middleware";
import type { ProjetosListResponse } from "@/lib/shared/types/projeto";
import type { FindManyProjetosParams } from "@/lib/server/db/interfaces/projetos-repository.interface";

/**
 * GET /api/projetos — paginated list with filters.
 *
 * - status=PUBLICADO (default): public; anyone can list.
 * - status=RASCUNHO or ARQUIVADO: requires auth. Master admins see all;
 *   other users only see projects they author or admin (entidade-admin).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const validation = listProjetosSchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      entidadeId: searchParams.get("entidadeId") ?? undefined,
      tags: searchParams.get("tags") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      tipoEntidade: searchParams.get("tipoEntidade") ?? undefined,
      orderBy: searchParams.get("orderBy") ?? undefined,
      order: searchParams.get("order") ?? undefined,
      usuarioId: searchParams.get("usuarioId") ?? undefined,
      scopedToMe: searchParams.get("scopedToMe") ?? undefined,
    });

    if (!validation.success) {
      return fromZodError(validation.error);
    }

    const { scopedToMe, ...rest } = validation.data;
    const params: FindManyProjetosParams = { ...rest };

    // Apply visibility scoping for non-PUBLICADO listings or when scopedToMe is set.
    // - Non-PUBLICADO: master admins see everything; others get auto-scoped.
    // - scopedToMe=true: caller explicitly asked for "their own" — always scope,
    //   even for MASTER_ADMIN, since the intent is to filter to their content.
    //   For "Meus Publicados" we additionally require that entidade-admin matches
    //   only count when the entidade is the *principal* author (so being admin of
    //   a co-author entidade doesn't surface the project in your "Meus" tab).
    const needsScoping = params.status !== "PUBLICADO" || scopedToMe === true;
    if (needsScoping) {
      const user = await getOptionalUser(request);
      if (!user) {
        return ApiError.tokenMissing();
      }
      const isMasterAdmin = user.papelPlataforma === "MASTER_ADMIN";
      if (!isMasterAdmin || scopedToMe === true) {
        const { membrosRepository } = getContainer();
        const memberships = await membrosRepository.findByUsuarioId(user.id);
        const adminEntidadeIds = memberships
          .filter(m => m.papel === "ADMIN" && !m.endedAt)
          .map(m => m.entidade.id);
        params.visibleToUserId = user.id;
        params.visibleToEntidadeIds = adminEntidadeIds;
        if (scopedToMe === true) {
          params.requireEntidadeAsPrincipal = true;
        }
      }
    }

    const { projetosRepository } = getContainer();

    const { page, limit } = params;
    const { projetos, total } = await projetosRepository.findMany(params);

    const response: ProjetosListResponse = {
      projetos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching projetos:", error);
    return ApiError.internal("Erro ao buscar projetos");
  }
}

/**
 * POST /api/projetos — authenticated. The requester must:
 *   - be among the user-authors (or MASTER_ADMIN), AND
 *   - be ADMIN of every entidade-author listed (or MASTER_ADMIN).
 */
export function POST(request: NextRequest) {
  return withAuth(request, async (req, usuario) => {
    try {
      const body = await req.json();

      const validation = createProjetoSchema.safeParse(body);
      if (!validation.success) {
        return fromZodError(validation.error);
      }

      const { autores, ...projetoData } = validation.data;
      const isMasterAdmin = usuario.papelPlataforma === "MASTER_ADMIN";

      const usuarioIds = autores.map(a => a.usuarioId).filter((id): id is string => !!id);
      const entidadeIds = autores.map(a => a.entidadeId).filter((id): id is string => !!id);

      if (!isMasterAdmin && !usuarioIds.includes(usuario.id)) {
        return ApiError.forbidden("Você só pode criar projetos em que esteja listado como autor.");
      }

      for (const entidadeId of entidadeIds) {
        if (!(await canManageVagaForEntidade(usuario, entidadeId))) {
          return ApiError.forbidden(
            "Você não tem permissão de admin em uma das entidades listadas como autor."
          );
        }
      }

      const { projetosRepository } = getContainer();

      if (await projetosRepository.slugExists(projetoData.slug)) {
        return ApiError.slugExists();
      }

      if (!(await projetosRepository.usuariosExist(usuarioIds))) {
        return ApiError.badRequest("Um ou mais usuários não existem");
      }

      if (!(await projetosRepository.entidadesExist(entidadeIds))) {
        return ApiError.badRequest("Uma ou mais entidades não existem");
      }

      const projeto = await projetosRepository.create(projetoData, autores);
      return NextResponse.json(projeto, { status: 201 });
    } catch (error) {
      console.error("Error creating projeto:", error);
      return ApiError.internal("Erro ao criar projeto");
    }
  });
}
