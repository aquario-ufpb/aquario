import { prisma } from "@/lib/server/db/prisma";
import type {
  ICargosRepository,
  Cargo,
  CreateCargoInput,
  UpdateCargoInput,
} from "@/lib/server/db/interfaces/cargos-repository.interface";

export class PrismaCargosRepository implements ICargosRepository {
  findByEntidadeId(entidadeId: string): Promise<Cargo[]> {
    return prisma.cargo.findMany({
      where: { entidadeId },
      orderBy: { ordem: "asc" },
    });
  }

  findById(id: string): Promise<Cargo | null> {
    return prisma.cargo.findUnique({
      where: { id },
    });
  }

  findByIdAndEntidade(cargoId: string, entidadeId: string): Promise<Cargo | null> {
    return prisma.cargo.findFirst({
      where: { id: cargoId, entidadeId },
    });
  }

  create(data: CreateCargoInput): Promise<Cargo> {
    return prisma.cargo.create({
      data: {
        nome: data.nome,
        descricao: data.descricao || null,
        ordem: data.ordem ?? 0,
        entidadeId: data.entidadeId,
      },
    });
  }

  async update(id: string, data: UpdateCargoInput): Promise<Cargo> {
    const updateData: Record<string, unknown> = {};

    if (data.nome !== undefined) {
      updateData.nome = data.nome;
    }
    if (data.descricao !== undefined) {
      updateData.descricao = data.descricao;
    }
    if (data.ordem !== undefined) {
      updateData.ordem = data.ordem;
    }

    return await prisma.cargo.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.cargo.delete({
      where: { id },
    });
  }
}
