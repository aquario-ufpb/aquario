import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { StatusProjeto } from '@prisma/client';

/**
 * POST /api/projetos/[slug]/publish
 * Publica um projeto (muda status de RASCUNHO para PUBLICADO)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // Check if projeto exists
    const projeto = await prisma.projeto.findUnique({
      where: { slug },
      include: {
        autores: true,
      },
    });

    if (!projeto) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    // Check if projeto is already published
    if (projeto.status === StatusProjeto.PUBLICADO) {
      return NextResponse.json(
        { error: 'Projeto já está publicado' },
        { status: 400 }
      );
    }

    // Validate projeto has required fields for publishing
    if (!projeto.titulo || !projeto.descricao) {
      return NextResponse.json(
        { error: 'Projeto deve ter título e descrição para ser publicado' },
        { status: 400 }
      );
    }

    if (projeto.autores.length === 0) {
      return NextResponse.json(
        { error: 'Projeto deve ter pelo menos um autor para ser publicado' },
        { status: 400 }
      );
    }

    // Update projeto status to PUBLICADO
    const updatedProjeto = await prisma.projeto.update({
      where: { slug },
      data: {
        status: StatusProjeto.PUBLICADO,
        publicadoEm: new Date(),
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
            autorPrincipal: 'desc',
          },
        },
        entidade: true,
      },
    });

    return NextResponse.json(updatedProjeto);
  } catch (error) {
    console.error('Error publishing projeto:', error);
    return NextResponse.json(
      { error: 'Erro ao publicar projeto' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projetos/[slug]/publish
 * Despublica um projeto (muda status de PUBLICADO para RASCUNHO)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

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

    // Check if projeto is published
    if (projeto.status !== StatusProjeto.PUBLICADO) {
      return NextResponse.json(
        { error: 'Projeto não está publicado' },
        { status: 400 }
      );
    }

    // Update projeto status to RASCUNHO
    const updatedProjeto = await prisma.projeto.update({
      where: { slug },
      data: {
        status: StatusProjeto.RASCUNHO,
        publicadoEm: null,
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
            autorPrincipal: 'desc',
          },
        },
        entidade: true,
      },
    });

    return NextResponse.json(updatedProjeto);
  } catch (error) {
    console.error('Error unpublishing projeto:', error);
    return NextResponse.json(
      { error: 'Erro ao despublicar projeto' },
      { status: 500 }
    );
  }
}
