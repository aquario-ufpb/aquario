import { prisma } from "@/lib/server/db/prisma";
import { PrismaProjetosRepository } from "../prisma-projetos-repository";

jest.mock("@/lib/server/db/prisma", () => ({
  prisma: { projeto: { updateMany: jest.fn(), findUnique: jest.fn() } },
}));

const repository = new PrismaProjetosRepository();

beforeEach(() => jest.clearAllMocks());

describe("marcarNotificado", () => {
  it("marca pelo id (não pelo slug) e devolve título e slug atuais da mesma linha", async () => {
    jest.mocked(prisma.projeto.updateMany).mockResolvedValue({ count: 1 });
    jest
      .mocked(prisma.projeto.findUnique)
      .mockResolvedValue({ slug: "robo-v2", titulo: "Robô 2" } as never);

    await expect(repository.marcarNotificado("p1")).resolves.toEqual({
      slug: "robo-v2",
      titulo: "Robô 2",
    });
    expect(prisma.projeto.updateMany).toHaveBeenCalledWith({
      where: { id: "p1", notificadoEm: null },
      data: { notificadoEm: expect.any(Date) },
    });
    expect(prisma.projeto.findUnique).toHaveBeenCalledWith({
      where: { id: "p1" },
      select: { slug: true, titulo: true },
    });
  });

  it("já notificado: não devolve nada nem relê a linha", async () => {
    jest.mocked(prisma.projeto.updateMany).mockResolvedValue({ count: 0 });

    await expect(repository.marcarNotificado("p1")).resolves.toBeNull();
    expect(prisma.projeto.findUnique).not.toHaveBeenCalled();
  });
});
