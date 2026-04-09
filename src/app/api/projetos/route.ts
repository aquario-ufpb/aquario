import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { createProjetoSchema, listProjetosSchema } from "@/lib/shared/validations/projeto";
import { ApiError, fromZodError } from "@/lib/server/errors/api-error";
import type { ProjetosListResponse } from "@/lib/shared/types/projeto";

/**
 * GET /api/projetos
 * Lista todos os projetos com paginação e filtros
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
 * POST /api/projetos
 * Cria um novo projeto com autores
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = createProjetoSchema.safeParse(body);

    if (!validation.success) {
      return fromZodError(validation.error);
    }

    const { autores, ...projetoData } = validation.data;
    const { projetosRepository } = getContainer();

    // Check if slug already exists
    if (await projetosRepository.slugExists(projetoData.slug)) {
      return ApiError.slugExists();
    }

    // Verify all usuarios exist
    const usuarioIds = autores.map(a => a.usuarioId);
    if (!(await projetosRepository.usuariosExist(usuarioIds))) {
      return ApiError.badRequest("Um ou mais usuários não existem");
    }

    // Create projeto with autores
    const projeto = await projetosRepository.create(projetoData, autores);

    return NextResponse.json(projeto, { status: 201 });
  } catch (error) {
    console.error("Error creating projeto:", error);
    return ApiError.internal("Erro ao criar projeto");
  }
}
