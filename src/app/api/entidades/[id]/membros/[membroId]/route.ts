import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { prisma } from "@/lib/server/db/prisma";
import { getContainer } from "@/lib/server/container";

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
          { message: "Você não tem permissão para editar membros desta entidade." },
          { status: 403 }
        );
      }

      // Check if membership exists
      const membership = await prisma.membroEntidade.findFirst({
        where: {
          id: membroId,
          entidadeId: entidadeId,
        },
      });

      if (!membership) {
        return NextResponse.json({ message: "Membresia não encontrada." }, { status: 404 });
      }

      // Validate cargoId if provided
      if (data.cargoId !== undefined && data.cargoId !== null) {
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

      // Build update data
      const updateData: Record<string, unknown> = {};
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

      const updatedMembro = await prisma.membroEntidade.update({
        where: { id: membroId },
        data: updateData,
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
        id: updatedMembro.id,
        usuario: {
          id: updatedMembro.usuario.id,
          nome: updatedMembro.usuario.nome,
          urlFotoPerfil: updatedMembro.usuario.urlFotoPerfil,
          curso: updatedMembro.usuario.curso
            ? {
                nome: updatedMembro.usuario.curso.nome,
              }
            : null,
        },
        papel: updatedMembro.papel,
        cargo: updatedMembro.cargo
          ? {
              id: updatedMembro.cargo.id,
              nome: updatedMembro.cargo.nome,
              descricao: updatedMembro.cargo.descricao,
              ordem: updatedMembro.cargo.ordem,
            }
          : null,
        startedAt: updatedMembro.startedAt.toISOString(),
        endedAt: updatedMembro.endedAt?.toISOString() || null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { message: error.errors[0]?.message || "Dados inválidos" },
          { status: 400 }
        );
      }

      const message = error instanceof Error ? error.message : "Erro ao atualizar membro";
      return NextResponse.json({ message }, { status: 400 });
    }
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  return await withAuth(request, async (_req, usuario) => {
    const { id: entidadeId, membroId } = await context.params;

    try {
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
          { message: "Você não tem permissão para deletar membros desta entidade." },
          { status: 403 }
        );
      }

      // Check if membership exists
      const membership = await prisma.membroEntidade.findFirst({
        where: {
          id: membroId,
          entidadeId: entidadeId,
        },
      });

      if (!membership) {
        return NextResponse.json({ message: "Membresia não encontrada." }, { status: 404 });
      }

      // Delete the membership
      await prisma.membroEntidade.delete({
        where: { id: membroId },
      });

      return NextResponse.json({ message: "Membresia deletada com sucesso." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao deletar membro";
      return NextResponse.json({ message }, { status: 400 });
    }
  });
}
