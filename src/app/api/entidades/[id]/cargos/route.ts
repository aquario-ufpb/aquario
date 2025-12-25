import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { prisma } from "@/lib/server/db/prisma";
import { getContainer } from "@/lib/server/container";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const createCargoSchema = z.object({
  nome: z.string().min(1, "Nome do cargo é obrigatório"),
  descricao: z.string().nullable().optional(),
  ordem: z.number().int().default(0),
});

const updateCargoSchema = z.object({
  nome: z.string().min(1, "Nome do cargo é obrigatório").optional(),
  descricao: z.string().nullable().optional(),
  ordem: z.number().int().optional(),
});

// GET - List all cargos for an entidade
export async function GET(_request: Request, context: RouteContext) {
  const { id: entidadeId } = await context.params;

  const cargos = await prisma.cargo.findMany({
    where: { entidadeId },
    orderBy: { ordem: "asc" },
  });

  return NextResponse.json(cargos);
}

// POST - Create a new cargo
export async function POST(request: Request, context: RouteContext) {
  return await withAuth(request, async (req, usuario) => {
    const { id: entidadeId } = await context.params;

    try {
      const body = await req.json();
      const data = createCargoSchema.parse(body);

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
          { message: "Você não tem permissão para criar cargos nesta entidade." },
          { status: 403 }
        );
      }

      const cargo = await prisma.cargo.create({
        data: {
          nome: data.nome,
          descricao: data.descricao || null,
          ordem: data.ordem,
          entidadeId,
        },
      });

      return NextResponse.json(cargo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { message: error.errors[0]?.message || "Dados inválidos" },
          { status: 400 }
        );
      }

      const message = error instanceof Error ? error.message : "Erro ao criar cargo";
      return NextResponse.json({ message }, { status: 400 });
    }
  });
}

// PUT - Update a cargo
export async function PUT(request: Request, context: RouteContext) {
  return await withAuth(request, async (req, usuario) => {
    const { id: entidadeId } = await context.params;

    try {
      const body = await req.json();
      const { cargoId, ...updateData } = body;

      if (!cargoId) {
        return NextResponse.json({ message: "ID do cargo é obrigatório." }, { status: 400 });
      }

      const data = updateCargoSchema.parse(updateData);

      // Check if cargo exists and belongs to this entidade
      const cargo = await prisma.cargo.findFirst({
        where: {
          id: cargoId,
          entidadeId,
        },
      });

      if (!cargo) {
        return NextResponse.json({ message: "Cargo não encontrado." }, { status: 404 });
      }

      const { entidadesRepository } = getContainer();
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
          { message: "Você não tem permissão para atualizar cargos nesta entidade." },
          { status: 403 }
        );
      }

      const updatedCargo = await prisma.cargo.update({
        where: { id: cargoId },
        data: {
          ...(data.nome !== undefined && { nome: data.nome }),
          ...(data.descricao !== undefined && { descricao: data.descricao }),
          ...(data.ordem !== undefined && { ordem: data.ordem }),
        },
      });

      return NextResponse.json(updatedCargo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { message: error.errors[0]?.message || "Dados inválidos" },
          { status: 400 }
        );
      }

      const message = error instanceof Error ? error.message : "Erro ao atualizar cargo";
      return NextResponse.json({ message }, { status: 400 });
    }
  });
}

// DELETE - Delete a cargo
export async function DELETE(request: Request, context: RouteContext) {
  return await withAuth(request, async (req, usuario) => {
    const { id: entidadeId } = await context.params;

    try {
      const { searchParams } = new URL(req.url);
      const cargoId = searchParams.get("cargoId");

      if (!cargoId) {
        return NextResponse.json({ message: "ID do cargo é obrigatório." }, { status: 400 });
      }

      // Check if cargo exists and belongs to this entidade
      const cargo = await prisma.cargo.findFirst({
        where: {
          id: cargoId,
          entidadeId,
        },
      });

      if (!cargo) {
        return NextResponse.json({ message: "Cargo não encontrado." }, { status: 404 });
      }

      const { entidadesRepository } = getContainer();
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
          { message: "Você não tem permissão para deletar cargos nesta entidade." },
          { status: 403 }
        );
      }

      await prisma.cargo.delete({
        where: { id: cargoId },
      });

      return NextResponse.json({ message: "Cargo deletado com sucesso." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao deletar cargo";
      return NextResponse.json({ message }, { status: 400 });
    }
  });
}
