import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db/prisma";
//import { StatusProjeto } from "@prisma/client";
import { createProjetoSchema, listProjetosSchema } from "@/lib/shared/validations/projeto";
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
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Parâmetros inválidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { page, limit, status, entidadeId, tags, search, orderBy, order } = validation.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (entidadeId) {
      where.entidadeId = entidadeId;
    }

    if (tags) {
      const tagArray = tags.split(",").map((t: string) => t.trim());
      where.tags = { hasSome: tagArray };
    }

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: "insensitive" } },
        { subtitulo: { contains: search, mode: "insensitive" } },
        { descricao: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build orderBy
    const orderByClause: any = {};
    orderByClause[orderBy] = order;

    // Get projetos and total count
    const [projetos, total] = await Promise.all([
      prisma.projeto.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderByClause,
        include: {
          autores: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                  urlFotoPerfil: true,
                  slug: true,
                  matricula: true,
                },
              },
            },
            orderBy: {
              autorPrincipal: "desc", // Principais primeiro
            },
          },
          entidade: {
            select: {
              id: true,
              nome: true,
              slug: true,
              tipo: true,
            },
          },
        },
      }),
      prisma.projeto.count({ where }),
    ]);

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
    return NextResponse.json({ error: "Erro ao buscar projetos" }, { status: 500 });
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
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { autores, ...projetoData } = validation.data;

    // Check if slug already exists
    const existingProjeto = await prisma.projeto.findUnique({
      where: { slug: projetoData.slug },
    });

    if (existingProjeto) {
      return NextResponse.json({ error: "Slug já existe" }, { status: 409 });
    }

    // Verify all usuarios exist
    const usuarioIds = autores.map((a: { usuarioId: string }) => a.usuarioId);

    const existingUsuarios = await prisma.usuario.findMany({
      where: { id: { in: usuarioIds } },
      select: { id: true },
    });

    if (existingUsuarios.length !== usuarioIds.length) {
      return NextResponse.json({ error: "Um ou mais usuários não existem" }, { status: 400 });
    }

    // Create projeto with autores
    const projeto = await prisma.projeto.create({
      data: {
        ...projetoData,
        autores: {
          create: autores.map((autor: { usuarioId: string; autorPrincipal: boolean }) => ({
            usuarioId: autor.usuarioId,
            autorPrincipal: autor.autorPrincipal,
          })),
        },
      },
      include: {
        autores: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
                urlFotoPerfil: true,
                slug: true,
                matricula: true,
              },
            },
          },
          orderBy: {
            autorPrincipal: "desc",
          },
        },
        entidade: true,
      },
    });

    return NextResponse.json(projeto, { status: 201 });
  } catch (error) {
    console.error("Error creating projeto:", error);
    return NextResponse.json({ error: "Erro ao criar projeto" }, { status: 500 });
  }
}
