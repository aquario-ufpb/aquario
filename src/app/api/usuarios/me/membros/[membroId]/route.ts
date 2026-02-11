import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { ApiError, fromZodError } from "@/lib/server/errors";

type RouteContext = {
  params: Promise<{ membroId: string }>;
};

const dateStringSchema = z
  .string()
  .refine(v => !isNaN(Date.parse(v)), { message: "Data inválida" });

const updateOwnMembershipSchema = z.object({
  papel: z.enum(["ADMIN", "MEMBRO"]).optional(),
  cargoId: z.string().uuid("ID de cargo inválido").nullable().optional(),
  startedAt: dateStringSchema.optional(),
  endedAt: dateStringSchema.nullable().optional(),
});

export async function PUT(request: Request, context: RouteContext) {
  return await withAuth(request, async (req, usuario) => {
    const { membroId } = await context.params;

    try {
      const body = await req.json();
      const data = updateOwnMembershipSchema.parse(body);

      const { membrosRepository } = getContainer();

      // Check if membership exists and belongs to the current user
      const membership = await membrosRepository.findById(membroId);

      if (!membership) {
        return ApiError.membroNotFound();
      }

      if (membership.usuarioId !== usuario.id) {
        return ApiError.forbidden("Você só pode editar suas próprias membresias.");
      }

      // Only MASTER_ADMIN can change papel
      if (data.papel !== undefined && usuario.papelPlataforma !== "MASTER_ADMIN") {
        delete data.papel;
      }

      // Validate cargoId if provided
      if (data.cargoId !== undefined && data.cargoId !== null) {
        const cargoExists = await membrosRepository.cargoExistsInEntidade(
          data.cargoId,
          membership.entidadeId
        );

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
        updateData.startedAt = new Date(data.startedAt);
      }
      if (data.endedAt !== undefined) {
        updateData.endedAt = data.endedAt ? new Date(data.endedAt) : null;
      }

      // Validate dates if both are being updated or if one is being updated and the other exists
      const finalStartedAt = updateData.startedAt || membership.startedAt;
      const finalEndedAt =
        updateData.endedAt !== undefined ? updateData.endedAt : membership.endedAt;

      if (finalStartedAt && finalEndedAt && finalStartedAt > finalEndedAt) {
        return ApiError.badRequest("A data de início deve ser anterior à data de término.");
      }

      await membrosRepository.update(membroId, updateData);

      // Get the updated membership with full entity data
      const updated = await membrosRepository.findByIdWithEntidade(membroId);

      if (!updated) {
        return ApiError.internal("Erro ao buscar membro atualizado");
      }

      return NextResponse.json({
        id: updated.id,
        entidade: updated.entidade,
        papel: updated.papel,
        cargo: updated.cargo,
        startedAt: updated.startedAt.toISOString(),
        endedAt: updated.endedAt?.toISOString() || null,
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
    const { membroId } = await context.params;

    try {
      const { membrosRepository } = getContainer();

      // Check if membership exists and belongs to the current user
      const membership = await membrosRepository.findById(membroId);

      if (!membership) {
        return ApiError.membroNotFound();
      }

      if (membership.usuarioId !== usuario.id) {
        return ApiError.forbidden("Você só pode deletar suas próprias membresias.");
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
