import { prisma } from "@/lib/server/db/prisma";
import { PrismaUsuariosRepository } from "../prisma-usuarios-repository";

const tx = {
  usuario: { findUniqueOrThrow: jest.fn(), delete: jest.fn() },
  projetoAutor: { findMany: jest.fn(), updateMany: jest.fn(), update: jest.fn() },
  projeto: { delete: jest.fn() },
};
jest.mock("@/lib/server/db/prisma", () => ({
  prisma: { $transaction: jest.fn() },
}));

const repository = new PrismaUsuariosRepository();

beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(prisma.$transaction)
    .mockImplementation(((fn: (client: typeof tx) => unknown) => fn(tx)) as never);
  tx.usuario.findUniqueOrThrow.mockResolvedValue({ urlFotoPerfil: "https://blob/foto.png" });
});

describe("excluirConta", () => {
  it("apaga projetos só do usuário e passa o principal dos compartilhados para a entidade", async () => {
    tx.projetoAutor.findMany.mockResolvedValue([
      {
        autorPrincipal: true,
        projeto: {
          id: "solo",
          urlImagem: "https://blob/capa.png",
          autores: [{ id: "a1", usuarioId: "u1", entidadeId: null }],
        },
      },
      {
        autorPrincipal: true,
        projeto: {
          id: "comp",
          urlImagem: null,
          autores: [
            { id: "a2", usuarioId: "u1", entidadeId: null },
            { id: "a3", usuarioId: "u2", entidadeId: null },
            { id: "a4", usuarioId: null, entidadeId: "e1" },
          ],
        },
      },
      {
        autorPrincipal: false,
        projeto: {
          id: "coautor",
          urlImagem: "https://blob/fica.png",
          autores: [
            { id: "a5", usuarioId: "u1", entidadeId: null },
            { id: "a6", usuarioId: "u3", entidadeId: null },
          ],
        },
      },
    ]);

    await expect(repository.excluirConta("u1")).resolves.toEqual({
      imagensOrfas: ["https://blob/foto.png", "https://blob/capa.png"],
    });

    expect(tx.projeto.delete).toHaveBeenCalledTimes(1);
    expect(tx.projeto.delete).toHaveBeenCalledWith({ where: { id: "solo" } });
    // Índice único de um principal por projeto: tira o atual antes de promover a entidade.
    expect(tx.projetoAutor.updateMany).toHaveBeenCalledWith({
      where: { projetoId: "comp", usuarioId: "u1" },
      data: { autorPrincipal: false },
    });
    expect(tx.projetoAutor.update).toHaveBeenCalledWith({
      where: { id: "a4" },
      data: { autorPrincipal: true },
    });
    expect(tx.projetoAutor.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
      tx.projetoAutor.update.mock.invocationCallOrder[0] ?? 0
    );
    // Coautoria não principal: o projeto fica como está.
    expect(tx.projetoAutor.update).toHaveBeenCalledTimes(1);
    expect(tx.usuario.delete).toHaveBeenCalledWith({ where: { id: "u1" } });
  });

  it("sem autor de entidade, outro usuário vira principal", async () => {
    tx.usuario.findUniqueOrThrow.mockResolvedValue({ urlFotoPerfil: null });
    tx.projetoAutor.findMany.mockResolvedValue([
      {
        autorPrincipal: true,
        projeto: {
          id: "comp",
          urlImagem: null,
          autores: [
            { id: "a1", usuarioId: "u1", entidadeId: null },
            { id: "a2", usuarioId: "u2", entidadeId: null },
          ],
        },
      },
    ]);

    await expect(repository.excluirConta("u1")).resolves.toEqual({ imagensOrfas: [] });
    expect(tx.projetoAutor.update).toHaveBeenCalledWith({
      where: { id: "a2" },
      data: { autorPrincipal: true },
    });
  });
});
