import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { createProjetoSchema, listProjetosSchema } from "@/lib/shared/validations/projeto";
import { ApiError, fromZodError } from "@/lib/server/errors/api-error";
import { withAuth, canManageVagaForEntidade } from "@/lib/server/services/auth/middleware";
import type { ProjetosListResponse } from "@/lib/shared/types/projeto";

/**
 * GET /api/projetos — public, paginated list with filters.
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
    });

    if (!validation.success) {
      return fromZodError(validation.error);
    }

    const { projetosRepository } = getContainer();

    const { page, limit } = validation.data;
    const { projetos, total } = await projetosRepository.findMany(validation.data);

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
