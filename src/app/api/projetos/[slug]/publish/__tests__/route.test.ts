/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST } from "../route";
import { getContainer } from "@/lib/server/container";
import { notificarNovoProjeto } from "@/lib/server/services/push/notificacoes";

jest.mock("next/server", () => ({
  ...jest.requireActual("next/server"),
  // Fora de uma requisição real do Next, `after` roda o callback na hora.
  after: (callback: () => unknown) => callback(),
}));
jest.mock("@/lib/server/services/auth/middleware", () => ({
  withAuth: (req: Request, handler: (req: Request, user: unknown) => Promise<Response>) =>
    handler(req, { id: "u1", papelPlataforma: "USER" }),
  canManageProjeto: jest.fn().mockResolvedValue(true),
}));
jest.mock("@/lib/server/container", () => ({ getContainer: jest.fn() }));
jest.mock("@/lib/server/services/push/notificacoes", () => ({
  notificarNovoProjeto: jest.fn().mockResolvedValue(undefined),
}));

const projetosRepository = {
  findBySlugWithAutores: jest.fn(),
  updateStatus: jest.fn(),
  marcarNotificado: jest.fn(),
};
const entidadesRepository = { findById: jest.fn() };
const projeto = (overrides: Record<string, unknown> = {}) => ({
  id: "p1",
  slug: "robo",
  titulo: "Robô",
  status: "RASCUNHO",
  publicadoEm: null,
  autores: [{ autorPrincipal: true, entidadeId: "e1", usuarioId: null }],
  ...overrides,
});

async function publicar() {
  const response = await POST(new NextRequest("http://localhost/api/projetos/robo/publish"), {
    params: Promise.resolve({ slug: "robo" }),
  });
  // Deixa o callback assíncrono do `after` terminar.
  await new Promise(resolve => setImmediate(resolve));
  return response;
}

beforeEach(() => {
  jest.clearAllMocks();
  (getContainer as jest.Mock).mockReturnValue({ projetosRepository, entidadesRepository });
  projetosRepository.updateStatus.mockResolvedValue({ slug: "robo", status: "PUBLICADO" });
  entidadesRepository.findById.mockResolvedValue({ id: "e1", nome: "TRIL" });
  projetosRepository.marcarNotificado.mockResolvedValue(true);
});

describe("publicar projeto", () => {
  it("avisa quem segue novidades das entidades na primeira publicação", async () => {
    projetosRepository.findBySlugWithAutores.mockResolvedValue(projeto());

    expect((await publicar()).status).toBe(200);
    expect(projetosRepository.marcarNotificado).toHaveBeenCalledWith("robo");
    expect(notificarNovoProjeto).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "robo", titulo: "Robô" }),
      "TRIL"
    );
  });

  it("não repete o aviso ao republicar nem em publicações simultâneas", async () => {
    // A marca durável já existe (ou outra requisição acabou de gravá-la).
    projetosRepository.findBySlugWithAutores.mockResolvedValue(projeto());
    projetosRepository.marcarNotificado.mockResolvedValue(false);

    await publicar();
    expect(notificarNovoProjeto).not.toHaveBeenCalled();
  });

  it("não avisa projetos pessoais", async () => {
    projetosRepository.findBySlugWithAutores.mockResolvedValue(
      projeto({ autores: [{ autorPrincipal: true, entidadeId: null, usuarioId: "u1" }] })
    );

    await publicar();
    expect(projetosRepository.marcarNotificado).not.toHaveBeenCalled();
    expect(notificarNovoProjeto).not.toHaveBeenCalled();
  });

  it("publica mesmo se a notificação falhar", async () => {
    projetosRepository.findBySlugWithAutores.mockResolvedValue(projeto());
    (notificarNovoProjeto as jest.Mock).mockRejectedValueOnce(new Error("expo fora"));

    expect((await publicar()).status).toBe(200);
  });
});
