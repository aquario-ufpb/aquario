import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { StatusProjeto } from "@prisma/client";
import { ApiError } from "@/lib/server/errors/api-error";

/**
 * POST /api/projetos/[slug]/publish
 * Publica um projeto (muda status de RASCUNHO para PUBLICADO)
 */
export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    const { projetosRepository } = getContainer();

    // Check if projeto exists with autores
    const projeto = await projetosRepository.findBySlugWithAutores(slug);

    if (!projeto) {
      return ApiError.notFound("Projeto");
    }

    // Check if projeto is already published
    if (projeto.status === StatusProjeto.PUBLICADO) {
      return ApiError.badRequest("Projeto já está publicado");
    }

    // Validate projeto has required fields for publishing
    if (!projeto.titulo || !projeto.descricao) {
      return ApiError.badRequest("Projeto deve ter título e descrição para ser publicado");
    }

    if (projeto.autores.length === 0) {
      return ApiError.badRequest("Projeto deve ter pelo menos um autor para ser publicado");
    }

    // Update projeto status to PUBLICADO
    const updatedProjeto = await projetosRepository.updateStatus(
      slug,
      StatusProjeto.PUBLICADO,
      new Date()
    );

    return NextResponse.json(updatedProjeto);
  } catch (error) {
    console.error("Error publishing projeto:", error);
    return ApiError.internal("Erro ao publicar projeto");
  }
}

/**
 * DELETE /api/projetos/[slug]/publish
 * Despublica um projeto (muda status de PUBLICADO para RASCUNHO)
 */
export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    const { projetosRepository } = getContainer();

    // Check if projeto exists
    const projeto = await projetosRepository.findBySlugBasic(slug);

    if (!projeto) {
      return ApiError.notFound("Projeto");
    }

    // Check if projeto is published
    if (projeto.status !== StatusProjeto.PUBLICADO) {
      return ApiError.badRequest("Projeto não está publicado");
    }

    // Update projeto status to RASCUNHO
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
}
