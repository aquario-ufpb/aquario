import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db/prisma";
import { updateProjetoSchema } from "@/lib/shared/validations/projeto";

/**
 * GET /api/projetos/[slug]
 * Obtém detalhes de um projeto específico pelo slug
 */
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;

    const projeto = await prisma.projeto.findUnique({
      where: { slug },
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
                centro: {
                  select: {
                    id: true,
                    nome: true,
                    sigla: true,
                  },
                },
                curso: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
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
            urlFoto: true,
            website: true,
            descricao: true,
          },
        },
      },
    });

    if (!projeto) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
    }

    return NextResponse.json(projeto);
  } catch (error) {
    console.error("Error fetching projeto:", error);
    return NextResponse.json({ error: "Erro ao buscar projeto" }, { status: 500 });
  }
}

/**
 * PATCH /api/projetos/[slug]
 * Atualiza um projeto (não atualiza autores)
 */
export async function PATCH(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    const body = await request.json();

    const validation = updateProjetoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if projeto exists
    const existingProjeto = await prisma.projeto.findUnique({
      where: { slug },
    });

    if (!existingProjeto) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
    }

    // Check if new slug already exists (if changing slug)
    if (data.slug && data.slug !== slug) {
      const slugExists = await prisma.projeto.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists) {
        return NextResponse.json({ error: "Slug já existe" }, { status: 409 });
      }
    }

    const projeto = await prisma.projeto.update({
      where: { slug },
      data,
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

    return NextResponse.json(projeto);
  } catch (error) {
    console.error("Error updating projeto:", error);
    return NextResponse.json({ error: "Erro ao atualizar projeto" }, { status: 500 });
  }
}

/**
 * DELETE /api/projetos/[slug]
 * Remove um projeto
 */
export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;

    // Check if projeto exists
    const projeto = await prisma.projeto.findUnique({
      where: { slug },
    });

    if (!projeto) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
    }

    // Delete projeto (cascade will delete ProjetoAutor relations)
    await prisma.projeto.delete({
      where: { slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting projeto:", error);
    return NextResponse.json({ error: "Erro ao remover projeto" }, { status: 500 });
  }
}
