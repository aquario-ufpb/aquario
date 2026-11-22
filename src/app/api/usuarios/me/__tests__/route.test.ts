/** @jest-environment node */
import { DELETE } from "../route";
import { getContainer } from "@/lib/server/container";
import { recordAuditLog } from "@/lib/server/services/audit-log";

const afterCallbacks: (() => Promise<unknown>)[] = [];
jest.mock("next/server", () => ({
  ...jest.requireActual("next/server"),
  after: (callback: () => Promise<unknown>) => afterCallbacks.push(callback),
}));
let usuarioAtual: { id: string; papelPlataforma: string };
jest.mock("@/lib/server/services/auth/middleware", () => ({
  withAuth: (req: Request, handler: (req: Request, user: unknown) => Promise<Response>) =>
    handler(req, usuarioAtual),
}));
jest.mock("@/lib/server/container", () => ({ getContainer: jest.fn() }));
jest.mock("@/lib/server/services/audit-log", () => ({ recordAuditLog: jest.fn() }));

const usuariosRepository = { excluirConta: jest.fn() };
const blobStorage = { delete: jest.fn() };
const excluir = () => DELETE(new Request("http://localhost/api/usuarios/me", { method: "DELETE" }));

beforeEach(() => {
  jest.clearAllMocks();
  afterCallbacks.length = 0;
  usuarioAtual = { id: "u1", papelPlataforma: "USER" };
  (getContainer as jest.Mock).mockReturnValue({ usuariosRepository, blobStorage });
  usuariosRepository.excluirConta.mockResolvedValue({ imagensOrfas: [] });
  blobStorage.delete.mockResolvedValue(true);
});

describe("DELETE /api/usuarios/me", () => {
  it("exclui a própria conta, registra no audit log depois e responde sem cache", async () => {
    const response = await excluir();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "Conta excluída com sucesso." });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(usuariosRepository.excluirConta).toHaveBeenCalledWith("u1");
    expect(recordAuditLog).toHaveBeenCalledWith(expect.any(Request), null, {
      action: "usuario.self_deleted",
      resourceType: "usuario",
      resourceId: "u1",
    });
    const ordemLog = (recordAuditLog as jest.Mock).mock.invocationCallOrder[0] ?? 0;
    const ordemExclusao = usuariosRepository.excluirConta.mock.invocationCallOrder[0] ?? 0;
    expect(ordemExclusao).toBeLessThan(ordemLog);
    expect(afterCallbacks).toHaveLength(0);
  });

  it("apaga as imagens órfãs depois da resposta, sem falhar se uma der erro", async () => {
    usuariosRepository.excluirConta.mockResolvedValue({
      imagensOrfas: ["https://blob/foto.png", "https://blob/capa.png"],
    });
    blobStorage.delete.mockRejectedValueOnce(new Error("blob fora")).mockResolvedValueOnce(true);

    expect((await excluir()).status).toBe(200);
    expect(blobStorage.delete).not.toHaveBeenCalled();

    await Promise.all(afterCallbacks.map(callback => callback()));
    expect(blobStorage.delete).toHaveBeenCalledWith("https://blob/foto.png");
    expect(blobStorage.delete).toHaveBeenCalledWith("https://blob/capa.png");
  });

  it("administrador da plataforma não exclui a própria conta", async () => {
    usuarioAtual = { id: "admin", papelPlataforma: "MASTER_ADMIN" };

    expect((await excluir()).status).toBe(403);
    expect(usuariosRepository.excluirConta).not.toHaveBeenCalled();
    expect(recordAuditLog).not.toHaveBeenCalled();
  });

  it("falha do banco vira 500 sem vazar a mensagem nem registrar exclusão", async () => {
    usuariosRepository.excluirConta.mockRejectedValue(new Error("Invalid `prisma` invocation"));

    const response = await excluir();

    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("prisma");
    expect(recordAuditLog).not.toHaveBeenCalled();
  });
});
