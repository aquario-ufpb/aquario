import { prisma } from "@/lib/server/db/prisma";
import type { IPushDispositivosRepository } from "../../interfaces/push-dispositivos-repository.interface";
import type { PushCategoria, RegistrarDispositivo } from "@/lib/shared/push/push";

export class PrismaPushDispositivosRepository implements IPushDispositivosRepository {
  async find(usuarioId: string, token: string) {
    const row = await prisma.dispositivoPush.findFirst({
      where: { token, usuarioId },
      select: { prazos: true, vagas: true, entidades: true },
    });
    return row ?? null;
  }

  async upsert(usuarioId: string, { token, plataforma, preferencias }: RegistrarDispositivo) {
    await prisma.dispositivoPush.upsert({
      where: { token },
      create: { token, usuarioId, plataforma, ...preferencias },
      update: { usuarioId, plataforma, ...preferencias },
    });
  }

  async delete(usuarioId: string, token: string) {
    await prisma.dispositivoPush.deleteMany({ where: { token, usuarioId } });
  }

  async tokensFor(categoria: PushCategoria) {
    const rows = await prisma.dispositivoPush.findMany({
      where: { [categoria]: true },
      select: { token: true },
    });
    return rows.map(row => row.token);
  }

  async deleteTokens(tokens: string[]) {
    if (tokens.length) {
      await prisma.dispositivoPush.deleteMany({ where: { token: { in: tokens } } });
    }
  }
}
