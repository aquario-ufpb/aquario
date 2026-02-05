import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { ApiError, fromZodError } from "@/lib/server/errors";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const addMemberSchema = z.object({
  usuarioId: z.string().uuid("ID de usuário inválido"),
  papel: z.enum(["ADMIN", "MEMBRO"]),
  cargoId: z.string().uuid("ID de cargo inválido").nullable().optional(),
  startedAt: z.string().optional(), // ISO date string
  endedAt: z.string().nullable().optional(), // ISO date string or null
});

export async function POST(request: Request, context: RouteContext) {
  return await withAuth(request, async (req, usuario) => {
    const { id: entidadeId } = await context.params;

    try {
      const body = await req.json();
      const data = addMemberSchema.parse(body);

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
        return ApiError.forbidden("Você não tem permissão para adicionar membros a esta entidade.");
      }

      // Check if user exists
      const userExists = await membrosRepository.usuarioExists(data.usuarioId);

      if (!userExists) {
        return ApiError.userNotFound();
      }

      // Check if user is already a member (active membership)
      const existingActiveMembership = await membrosRepository.findActiveByUsuarioAndEntidade(
        data.usuarioId,
        entidadeId
      );

      if (existingActiveMembership) {
        return ApiError.alreadyMember();
      }

      // Validate cargoId if provided
      if (data.cargoId) {
        const cargoExists = await membrosRepository.cargoExistsInEntidade(data.cargoId, entidadeId);

        if (!cargoExists) {
          return ApiError.badRequest("Cargo não encontrado ou não pertence a esta entidade.");
        }
      }

      // Create membership
      const startedAt = data.startedAt ? new Date(data.startedAt) : new Date();
      const endedAt = data.endedAt ? new Date(data.endedAt) : null;

      const membro = await membrosRepository.create({
        usuarioId: data.usuarioId,
        entidadeId: entidadeId,
        papel: data.papel,
        cargoId: data.cargoId ?? undefined,
        startedAt,
        endedAt,
      });

      return NextResponse.json({
        id: membro.id,
        usuario: {
          id: membro.usuario.id,
          nome: membro.usuario.nome,
          slug: membro.usuario.slug,
          urlFotoPerfil: membro.usuario.urlFotoPerfil,
          eFacade: membro.usuario.eFacade,
          curso: membro.usuario.curso,
        },
        papel: membro.papel,
        cargo: membro.cargo,
        startedAt: membro.startedAt.toISOString(),
        endedAt: membro.endedAt?.toISOString() || null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fromZodError(error);
      }

      const message = error instanceof Error ? error.message : "Erro ao adicionar membro";
      return ApiError.badRequest(message);
    }
  });
}
