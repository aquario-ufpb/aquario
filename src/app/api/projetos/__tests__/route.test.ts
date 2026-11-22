/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST } from "../route";
import { getContainer } from "@/lib/server/container";
import { agendarAvisoDeNovoProjeto } from "@/lib/server/services/push/novo-projeto";

jest.mock("@/lib/server/services/auth/middleware", () => ({
  withAuth: (req: Request, handler: (req: Request, user: unknown) => Promise<Response>) =>
    handler(req, { id: "u1", papelPlataforma: "USER" }),
  canManageVagaForEntidade: jest.fn().mockResolvedValue(true),
  getOptionalUser: jest.fn(),
}));
jest.mock("@/lib/server/container", () => ({ getContainer: jest.fn() }));
jest.mock("@/lib/server/services/push/novo-projeto", () => ({
  agendarAvisoDeNovoProjeto: jest.fn(),
}));

const ENTIDADE_ID = "6f1c2b9e-3a4d-4e5f-8a7b-1c2d3e4f5a6b";
const projetosRepository = {
  slugExists: jest.fn().mockResolvedValue(false),
  usuariosExist: jest.fn().mockResolvedValue(true),
  entidadesExist: jest.fn().mockResolvedValue(true),
  create: jest.fn(),
};

function criar(status: "PUBLICADO" | "RASCUNHO") {
  return POST(
    new NextRequest("http://localhost/api/projetos", {
      method: "POST",
      body: JSON.stringify({
        titulo: "Robô",
        slug: "robo",
        status,
        autores: [{ entidadeId: ENTIDADE_ID, autorPrincipal: true }],
      }),
    })
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  (getContainer as jest.Mock).mockReturnValue({ projetosRepository });
  projetosRepository.create.mockImplementation((data: Record<string, unknown>) =>
    Promise.resolve({
      ...data,
      autores: [{ autorPrincipal: true, entidadeId: ENTIDADE_ID, usuarioId: null }],
    })
  );
});

describe("criar projeto", () => {
  it("criar já publicado conta como publicação: grava publicadoEm e agenda o aviso", async () => {
    const response = await criar("PUBLICADO");

    expect(response.status).toBe(201);
    const [data] = projetosRepository.create.mock.calls[0] ?? [];
    expect(data.publicadoEm).toBeInstanceOf(Date);
    expect(agendarAvisoDeNovoProjeto).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "robo", titulo: "Robô" })
    );
  });

  it("rascunho não avisa nem grava publicadoEm", async () => {
    expect((await criar("RASCUNHO")).status).toBe(201);
    const [data] = projetosRepository.create.mock.calls[0] ?? [];
    expect(data.publicadoEm).toBeUndefined();
    expect(agendarAvisoDeNovoProjeto).not.toHaveBeenCalled();
  });
});
