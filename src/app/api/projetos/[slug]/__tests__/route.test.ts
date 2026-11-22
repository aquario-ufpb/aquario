/** @jest-environment node */
import { NextRequest } from "next/server";
import { PATCH } from "../route";
import { getContainer } from "@/lib/server/container";
import { agendarAvisoDeNovoProjeto } from "@/lib/server/services/push/novo-projeto";

jest.mock("@/lib/server/services/auth/middleware", () => ({
  withAuth: (req: Request, handler: (req: Request, user: unknown) => Promise<Response>) =>
    handler(req, { id: "u1", papelPlataforma: "USER" }),
  canManageProjeto: jest.fn().mockResolvedValue(true),
  getOptionalUser: jest.fn(),
}));
jest.mock("@/lib/server/container", () => ({ getContainer: jest.fn() }));
jest.mock("@/lib/server/services/push/novo-projeto", () => ({
  agendarAvisoDeNovoProjeto: jest.fn(),
}));

const autores = [{ autorPrincipal: true, entidadeId: "e1", usuarioId: null }];
const projetosRepository = {
  findBySlugWithAutores: jest.fn(),
  slugExists: jest.fn().mockResolvedValue(false),
  update: jest.fn(),
};

function editar(body: Record<string, unknown>) {
  return PATCH(
    new NextRequest("http://localhost/api/projetos/robo", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ slug: "robo" }) }
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  (getContainer as jest.Mock).mockReturnValue({ projetosRepository });
  projetosRepository.update.mockImplementation((slug: string, data: Record<string, unknown>) =>
    Promise.resolve({
      slug: data.slug ?? slug,
      titulo: "Robô",
      urlImagem: null,
      autores,
      ...data,
    })
  );
});

describe("editar projeto", () => {
  it("publicar um rascunho pelo PATCH agenda o aviso com o slug novo", async () => {
    projetosRepository.findBySlugWithAutores.mockResolvedValue({
      slug: "robo",
      titulo: "Robô",
      status: "RASCUNHO",
      urlImagem: null,
      autores,
    });

    const response = await editar({ status: "PUBLICADO", slug: "robo-v2" });

    expect(response.status).toBe(200);
    expect(agendarAvisoDeNovoProjeto).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "robo-v2" })
    );
  });

  it("editar um projeto já publicado não avisa de novo", async () => {
    projetosRepository.findBySlugWithAutores.mockResolvedValue({
      slug: "robo",
      titulo: "Robô",
      status: "PUBLICADO",
      urlImagem: null,
      autores,
    });

    expect((await editar({ status: "PUBLICADO", titulo: "Robô 2" })).status).toBe(200);
    expect((await editar({ titulo: "Robô 3" })).status).toBe(200);
    expect(agendarAvisoDeNovoProjeto).not.toHaveBeenCalled();
  });
});
