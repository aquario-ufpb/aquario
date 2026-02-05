import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { ApiError, fromZodError } from "@/lib/server/errors";

type RouteContext = {
  params: Promise<{ id: string; membroId: string }>;
};

const updateMemberSchema = z.object({
  papel: z.enum(["ADMIN", "MEMBRO"]).optional(),
  cargoId: z.string().uuid("ID de cargo inválido").nullable().optional(),
  startedAt: z.string().optional(), // ISO date string
  endedAt: z.string().nullable().optional(), // ISO date string or null
});

export async function PUT(request: Request, context: RouteContext) {
  return await withAuth(request, async (req, usuario) => {
    const { id: entidadeId, membroId } = await context.params;

    try {
      const body = await req.json();
      const data = updateMemberSchema.parse(body);

      const { entidadesRepository, membrosRepository } = getContainer();

      // Check if entidade exists
      const entidade = await entidadesRepository.findById(entidadeId);
      if (!entidade) {
        return ApiError.entidadeNotFound();
      }

      // Check if user has permission (MASTER_ADMIN or entidade ADMIN)
      const isMasterAdmin = usuario.papelPlataforma === "MASTER_ADMIN";
      const isEntidadeAdmin = entidade.membros?.some(
        (m: { usuario: { id: string }; papel: string }) =>
          m.usuario.id === usuario.id && m.papel === "ADMIN"
      );

      if (!isMasterAdmin && !isEntidadeAdmin) {
        return ApiError.forbidden("Você não tem permissão para editar membros desta entidade.");
      }

      // Check if membership exists
      const membership = await membrosRepository.findByEntidadeAndMembro(entidadeId, membroId);

      if (!membership) {
        return ApiError.membroNotFound();
      }

      // Validate cargoId if provided
      if (data.cargoId !== undefined && data.cargoId !== null) {
        const cargoExists = await membrosRepository.cargoExistsInEntidade(data.cargoId, entidadeId);

        if (!cargoExists) {
          return ApiError.badRequest("Cargo não encontrado ou não pertence a esta entidade.");
        }
      }

      // Build update data
      const updateData: {
        papel?: "ADMIN" | "MEMBRO";
        cargoId?: string | null;
        startedAt?: Date;
        endedAt?: Date | null;
      } = {};
      if (data.papel !== undefined) {
        updateData.papel = data.papel;
      }
      if (data.cargoId !== undefined) {
        updateData.cargoId = data.cargoId;
      }
      if (data.startedAt !== undefined) {
        updateData.startedAt = data.startedAt ? new Date(data.startedAt) : new Date();
      }
      if (data.endedAt !== undefined) {
        updateData.endedAt = data.endedAt ? new Date(data.endedAt) : null;
      }

      const updatedMembro = await membrosRepository.update(membroId, updateData);

      return NextResponse.json({
        id: updatedMembro.id,
        usuario: {
          id: updatedMembro.usuario.id,
          nome: updatedMembro.usuario.nome,
          slug: updatedMembro.usuario.slug,
          urlFotoPerfil: updatedMembro.usuario.urlFotoPerfil,
          eFacade: updatedMembro.usuario.eFacade,
          curso: updatedMembro.usuario.curso,
        },
        papel: updatedMembro.papel,
        cargo: updatedMembro.cargo,
        startedAt: updatedMembro.startedAt.toISOString(),
        endedAt: updatedMembro.endedAt?.toISOString() || null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fromZodError(error);
      }

      const message = error instanceof Error ? error.message : "Erro ao atualizar membro";
      return ApiError.badRequest(message);
    }
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  return await withAuth(request, async (_req, usuario) => {
    const { id: entidadeId, membroId } = await context.params;

    try {
      const { entidadesRepository, membrosRepository } = getContainer();

      // Check if entidade exists
      const entidade = await entidadesRepository.findById(entidadeId);
      if (!entidade) {
        return ApiError.entidadeNotFound();
      }

      // Check if user has permission (MASTER_ADMIN or entidade ADMIN)
      const isMasterAdmin = usuario.papelPlataforma === "MASTER_ADMIN";
      const isEntidadeAdmin = entidade.membros?.some(
        (m: { usuario: { id: string }; papel: string }) =>
          m.usuario.id === usuario.id && m.papel === "ADMIN"
      );

      if (!isMasterAdmin && !isEntidadeAdmin) {
        return ApiError.forbidden("Você não tem permissão para deletar membros desta entidade.");
      }

      // Check if membership exists
      const membership = await membrosRepository.findByEntidadeAndMembro(entidadeId, membroId);

      if (!membership) {
        return ApiError.membroNotFound();
      }

      // Delete the membership
      await membrosRepository.delete(membroId);

      return NextResponse.json({ message: "Membresia deletada com sucesso." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao deletar membro";
      return ApiError.badRequest(message);
    }
  });
}
