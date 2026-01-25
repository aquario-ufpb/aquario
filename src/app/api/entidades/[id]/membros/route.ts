import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { prisma } from "@/lib/server/db/prisma";

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

      const { entidadesRepository } = getContainer();

      // Check if entidade exists
      const entidade = await entidadesRepository.findById(entidadeId);
      if (!entidade) {
        return NextResponse.json({ message: "Entidade não encontrada." }, { status: 404 });
      }

      // Check if user has permission (MASTER_ADMIN or entidade ADMIN)
      const isMasterAdmin = usuario.papelPlataforma === "MASTER_ADMIN";
      const isEntidadeAdmin = entidade.membros?.some(
        (m: { usuario: { id: string }; papel: string }) =>
          m.usuario.id === usuario.id && m.papel === "ADMIN"
      );

      if (!isMasterAdmin && !isEntidadeAdmin) {
        return NextResponse.json(
          { message: "Você não tem permissão para adicionar membros a esta entidade." },
          { status: 403 }
        );
      }

      // Check if user exists
      const userExists = await prisma.usuario.findUnique({
        where: { id: data.usuarioId },
      });

      if (!userExists) {
        return NextResponse.json({ message: "Usuário não encontrado." }, { status: 404 });
      }

      // Check if user is already a member (active membership)
      const existingActiveMembership = await prisma.membroEntidade.findFirst({
        where: {
          usuarioId: data.usuarioId,
          entidadeId: entidadeId,
          endedAt: null, // Only check active memberships
        },
      });

      if (existingActiveMembership) {
        return NextResponse.json(
          { message: "Este usuário já é membro ativo desta entidade." },
          { status: 400 }
        );
      }

      // Validate cargoId if provided
      if (data.cargoId) {
        const cargo = await prisma.cargo.findFirst({
          where: {
            id: data.cargoId,
            entidadeId: entidadeId,
          },
        });

        if (!cargo) {
          return NextResponse.json(
            { message: "Cargo não encontrado ou não pertence a esta entidade." },
            { status: 400 }
          );
        }
      }

      // Create membership
      const startedAt = data.startedAt ? new Date(data.startedAt) : new Date();
      const endedAt = data.endedAt ? new Date(data.endedAt) : null;

      const membro = await prisma.membroEntidade.create({
        data: {
          usuarioId: data.usuarioId,
          entidadeId: entidadeId,
          papel: data.papel,
          cargoId: data.cargoId || null,
          startedAt,
          endedAt,
        },
        include: {
          usuario: {
            include: {
              curso: true,
            },
          },
          cargo: true,
        },
      });

      return NextResponse.json({
        id: membro.id,
        usuario: {
          id: membro.usuario.id,
          nome: membro.usuario.nome,
          slug: membro.usuario.slug,
          urlFotoPerfil: membro.usuario.urlFotoPerfil,
          eFacade: membro.usuario.eFacade,
          curso: membro.usuario.curso
            ? {
                nome: membro.usuario.curso.nome,
              }
            : null,
        },
        papel: membro.papel,
        cargo: membro.cargo
          ? {
              id: membro.cargo.id,
              nome: membro.cargo.nome,
              descricao: membro.cargo.descricao,
              ordem: membro.cargo.ordem,
            }
          : null,
        startedAt: membro.startedAt.toISOString(),
        endedAt: membro.endedAt?.toISOString() || null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { message: error.errors[0]?.message || "Dados inválidos" },
          { status: 400 }
        );
      }

      const message = error instanceof Error ? error.message : "Erro ao adicionar membro";
      return NextResponse.json({ message }, { status: 400 });
    }
  });
}
