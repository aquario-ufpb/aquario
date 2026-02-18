import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { updateProjetoAutoresSchema } from '@/lib/shared/validations/projeto';

/**
 * PUT /api/projetos/[slug]/autores
 * Atualiza os autores de um projeto (substitui todos)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();

    const validation = updateProjetoAutoresSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { autores } = validation.data;

    // Check if projeto exists
    const projeto = await prisma.projeto.findUnique({
      where: { slug },
    });

    if (!projeto) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    // Verify all usuarios exist
    const usuarioIds = autores.map((a: { usuarioId: string }) => a.usuarioId);

    const existingUsuarios = await prisma.usuario.findMany({
      where: { id: { in: usuarioIds } },
      select: { id: true },
    });

    if (existingUsuarios.length !== usuarioIds.length) {
      return NextResponse.json(
        { error: 'Um ou mais usuários não existem' },
        { status: 400 }
      );
    }

    // Delete existing autores and create new ones
    await prisma.$transaction([
      prisma.projetoAutor.deleteMany({
        where: { projetoId: projeto.id },
      }),
      prisma.projetoAutor.createMany({
        data: autores.map((autor: {
          usuarioId: string;
          autorPrincipal: boolean;
        }) => ({
          projetoId: projeto.id,
          usuarioId: autor.usuarioId,
          autorPrincipal: autor.autorPrincipal,
        })),
      }),
    ]);

    // Fetch updated projeto
    const updatedProjeto = await prisma.projeto.findUnique({
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
              },
            },
          },
          orderBy: {
            autorPrincipal: 'desc',
          },
        },
        entidade: true,
      },
    });

    return NextResponse.json(updatedProjeto);
  } catch (error) {
    console.error('Error updating projeto autores:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar autores do projeto' },
      { status: 500 }
    );
  }
}
