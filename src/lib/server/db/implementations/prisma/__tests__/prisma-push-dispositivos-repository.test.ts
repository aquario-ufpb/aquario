import { prisma } from "@/lib/server/db/prisma";
import {
  MAX_DISPOSITIVOS_POR_CONTA,
  PrismaPushDispositivosRepository,
} from "../prisma-push-dispositivos-repository";

jest.mock("@/lib/server/db/prisma", () => ({
  prisma: {
    dispositivoPush: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    pushEnvio: { createMany: jest.fn() },
  },
}));

const repository = new PrismaPushDispositivosRepository();
const dispositivo = {
  token: "ExponentPushToken[novo]",
  plataforma: "android" as const,
  preferencias: { prazos: true, vagas: false, entidades: false },
};

beforeEach(() => jest.clearAllMocks());

describe("tokensFor", () => {
  it("filtra pela categoria pedida e devolve só os tokens", async () => {
    jest
      .mocked(prisma.dispositivoPush.findMany)
      .mockResolvedValue([
        { token: "ExponentPushToken[a]" },
        { token: "ExponentPushToken[b]" },
      ] as never);

    await expect(repository.tokensFor("vagas")).resolves.toEqual([
      "ExponentPushToken[a]",
      "ExponentPushToken[b]",
    ]);
    expect(prisma.dispositivoPush.findMany).toHaveBeenCalledWith({
      where: { vagas: true },
      select: { token: true },
    });
  });
});

describe("upsert", () => {
  it("só apaga o excedente observado, preservando um aparelho transferido ou renovado", async () => {
    const observadoEm = new Date("2026-11-01T10:00:00Z");
    jest
      .mocked(prisma.dispositivoPush.findMany)
      .mockResolvedValue([
        { token: "ExponentPushToken[velho]", atualizadoEm: observadoEm },
      ] as never);

    await repository.upsert("u1", dispositivo);

    expect(prisma.dispositivoPush.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { usuarioId: "u1" }, skip: MAX_DISPOSITIVOS_POR_CONTA })
    );
    // Filtra também por conta e `atualizadoEm`: se outra conta assumiu o token nesse meio-tempo,
    // a exclusão não casa e o cadastro novo fica.
    expect(prisma.dispositivoPush.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [{ token: "ExponentPushToken[velho]", usuarioId: "u1", atualizadoEm: observadoEm }],
      },
    });
  });

  it("não apaga nada dentro do limite", async () => {
    jest.mocked(prisma.dispositivoPush.findMany).mockResolvedValue([]);
    await repository.upsert("u1", dispositivo);
    expect(prisma.dispositivoPush.deleteMany).not.toHaveBeenCalled();
  });
});

describe("reservarEnvio", () => {
  it("só a primeira reserva da chave vale", async () => {
    jest
      .mocked(prisma.pushEnvio.createMany)
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    await expect(repository.reservarEnvio("prazos:2026-11-05")).resolves.toBe(true);
    await expect(repository.reservarEnvio("prazos:2026-11-05")).resolves.toBe(false);
    expect(prisma.pushEnvio.createMany).toHaveBeenCalledWith({
      data: [{ chave: "prazos:2026-11-05" }],
      skipDuplicates: true,
    });
  });
});
