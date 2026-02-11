import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { ApiError, fromZodError } from "@/lib/server/errors";

const dateStringSchema = z
  .string()
  .refine(v => !isNaN(Date.parse(v)), { message: "Data inválida" });

const createOwnMembershipSchema = z.object({
  entidadeId: z.string().uuid("ID de entidade inválido"),
  papel: z.enum(["ADMIN", "MEMBRO"]).optional().default("MEMBRO"),
  cargoId: z.string().uuid("ID de cargo inválido").nullable().optional(),
  startedAt: dateStringSchema.optional(),
  endedAt: dateStringSchema.nullable().optional(),
});

export function GET(request: Request) {
  return withAuth(request, async (_req, usuario) => {
    try {
      const { membrosRepository } = getContainer();

      // Get all memberships for the current user
      const memberships = await membrosRepository.findByUsuarioId(usuario.id);

      // Format the response
      const formattedMemberships = memberships.map(m => ({
        id: m.id,
        entidade: m.entidade,
        papel: m.papel,
        cargo: m.cargo,
        startedAt: m.startedAt.toISOString(),
        endedAt: m.endedAt?.toISOString() || null,
      }));

      return NextResponse.json(formattedMemberships);
    } catch {
      return ApiError.internal("Erro ao buscar membros");
    }
  });
}

export async function POST(request: Request) {
  return await withAuth(request, async (req, usuario) => {
    try {
      const body = await req.json();
      const data = createOwnMembershipSchema.parse(body);

      const { entidadesRepository, membrosRepository } = getContainer();

      // Only MASTER_ADMIN can set papel to ADMIN
      if (data.papel === "ADMIN" && usuario.papelPlataforma !== "MASTER_ADMIN") {
        data.papel = "MEMBRO";
      }

      // Check if entidade exists
      const entidade = await entidadesRepository.findById(data.entidadeId);
      if (!entidade) {
        return ApiError.entidadeNotFound();
      }

      // Check if user is already a member (active membership)
      const existingActiveMembership = await membrosRepository.findActiveByUsuarioAndEntidade(
        usuario.id,
        data.entidadeId
      );

      if (existingActiveMembership) {
        return ApiError.alreadyMember();
      }

      // Validate cargoId if provided
      if (data.cargoId) {
        const cargoExists = await membrosRepository.cargoExistsInEntidade(
          data.cargoId,
          data.entidadeId
        );

        if (!cargoExists) {
          return ApiError.badRequest("Cargo não encontrado ou não pertence a esta entidade.");
        }
      }

      // Validate dates if both are provided
      if (data.startedAt && data.endedAt) {
        const startDate = new Date(data.startedAt);
        const endDate = new Date(data.endedAt);
        if (startDate > endDate) {
          return ApiError.badRequest("A data de início deve ser anterior à data de término.");
        }
      }

      // Create membership
      const startedAt = data.startedAt ? new Date(data.startedAt) : new Date();
      const endedAt = data.endedAt ? new Date(data.endedAt) : null;

      const membro = await membrosRepository.create({
        usuarioId: usuario.id,
        entidadeId: data.entidadeId,
        papel: data.papel,
        cargoId: data.cargoId ?? undefined,
        startedAt,
        endedAt,
      });

      return NextResponse.json({
        id: membro.id,
        entidade: {
          id: entidade.id,
          nome: entidade.nome,
          slug: entidade.slug,
          tipo: entidade.tipo,
          urlFoto: entidade.urlFoto,
          centro: entidade.centro
            ? {
                id: entidade.centro.id,
                nome: entidade.centro.nome,
                sigla: entidade.centro.sigla,
              }
            : null,
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
