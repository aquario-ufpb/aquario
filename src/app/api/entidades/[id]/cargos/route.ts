import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { ApiError, fromZodError } from "@/lib/server/errors";

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
  try {
    const { id: entidadeId } = await context.params;
    const { cargosRepository } = getContainer();

    const cargos = await cargosRepository.findByEntidadeId(entidadeId);

    return NextResponse.json(cargos);
  } catch {
    return ApiError.internal("Erro ao buscar cargos");
  }
}

// POST - Create a new cargo
export async function POST(request: Request, context: RouteContext) {
  return await withAuth(request, async (req, usuario) => {
    const { id: entidadeId } = await context.params;

    try {
      const body = await req.json();
      const data = createCargoSchema.parse(body);

      const { entidadesRepository, cargosRepository } = getContainer();

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
        return ApiError.forbidden("Você não tem permissão para criar cargos nesta entidade.");
      }

      const cargo = await cargosRepository.create({
        nome: data.nome,
        descricao: data.descricao,
        ordem: data.ordem,
        entidadeId,
      });

      return NextResponse.json(cargo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fromZodError(error);
      }

      const message = error instanceof Error ? error.message : "Erro ao criar cargo";
      return ApiError.badRequest(message);
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
        return ApiError.badRequest("ID do cargo é obrigatório.");
      }

      const data = updateCargoSchema.parse(updateData);
      const { entidadesRepository, cargosRepository } = getContainer();

      // Check if cargo exists and belongs to this entidade
      const cargo = await cargosRepository.findByIdAndEntidade(cargoId, entidadeId);

      if (!cargo) {
        return ApiError.cargoNotFound();
      }

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
        return ApiError.forbidden("Você não tem permissão para atualizar cargos nesta entidade.");
      }

      const updatedCargo = await cargosRepository.update(cargoId, data);

      return NextResponse.json(updatedCargo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return fromZodError(error);
      }

      const message = error instanceof Error ? error.message : "Erro ao atualizar cargo";
      return ApiError.badRequest(message);
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
        return ApiError.badRequest("ID do cargo é obrigatório.");
      }

      const { entidadesRepository, cargosRepository } = getContainer();

      // Check if cargo exists and belongs to this entidade
      const cargo = await cargosRepository.findByIdAndEntidade(cargoId, entidadeId);

      if (!cargo) {
        return ApiError.cargoNotFound();
      }

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
        return ApiError.forbidden("Você não tem permissão para deletar cargos nesta entidade.");
      }

      await cargosRepository.delete(cargoId);

      return NextResponse.json({ message: "Cargo deletado com sucesso." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao deletar cargo";
      return ApiError.badRequest(message);
    }
  });
}
