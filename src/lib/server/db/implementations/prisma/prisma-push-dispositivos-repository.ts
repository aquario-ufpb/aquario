import { prisma } from "@/lib/server/db/prisma";
import type { IPushDispositivosRepository } from "../../interfaces/push-dispositivos-repository.interface";
import type { PushCategoria, RegistrarDispositivo } from "@/lib/shared/push/push";

/** Aparelhos por conta: além disso, os registrados há mais tempo saem. */
export const MAX_DISPOSITIVOS_POR_CONTA = 10;

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
    const excedentes = await prisma.dispositivoPush.findMany({
      where: { usuarioId },
      orderBy: { atualizadoEm: "desc" },
      skip: MAX_DISPOSITIVOS_POR_CONTA,
      select: { token: true, atualizadoEm: true },
    });
    if (excedentes.length) {
      // Apaga só o registro observado: se o aparelho mudou de conta ou foi renovado entre a
      // consulta e a exclusão, `usuarioId` ou `atualizadoEm` não batem mais e ele fica.
      await prisma.dispositivoPush.deleteMany({
        where: {
          OR: excedentes.map(({ token, atualizadoEm }) => ({ token, usuarioId, atualizadoEm })),
        },
      });
    }
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

  async reservarEnvio(chave: string) {
    const { count } = await prisma.pushEnvio.createMany({
      data: [{ chave }],
      skipDuplicates: true,
    });
    return count === 1;
  }

  async deleteTokens(tokens: string[]) {
    if (tokens.length) {
      await prisma.dispositivoPush.deleteMany({ where: { token: { in: tokens } } });
    }
  }
}
