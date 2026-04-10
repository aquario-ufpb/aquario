/**
 * @jest-environment node
 */
import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";

const mockVerifyToken = jest.fn();
const mockUserFindById = jest.fn();
const mockEntidadeFindById = jest.fn();
const mockFindByEntidadeAndMembro = jest.fn();
const mockCargoExistsInEntidade = jest.fn();
const mockMembroUpdate = jest.fn();
const mockMembroDelete = jest.fn();

jest.mock("@/lib/server/services/jwt/jwt", () => ({
  verifyToken: (...args: unknown[]) => mockVerifyToken(...args),
}));

jest.mock("@/lib/server/container", () => ({
  getContainer: () => ({
    usuariosRepository: { findById: mockUserFindById },
    entidadesRepository: { findById: mockEntidadeFindById },
    membrosRepository: {
      findByEntidadeAndMembro: mockFindByEntidadeAndMembro,
      cargoExistsInEntidade: mockCargoExistsInEntidade,
      update: mockMembroUpdate,
      delete: mockMembroDelete,
    },
  }),
}));

import { PUT, DELETE } from "../route";

function makeUsuario(overrides: Partial<UsuarioWithRelations> = {}): UsuarioWithRelations {
  return {
    id: "caller-1",
    nome: "Caller",
    papelPlataforma: "MASTER_ADMIN",
    eFacade: false,
    centro: { id: "c1", nome: "CI", sigla: "CI", descricao: null, campusId: "campus-1" },
    curso: { id: "k1", nome: "CC", centroId: "c1", criadoEm: new Date(), atualizadoEm: new Date() },
    ...overrides,
  } as unknown as UsuarioWithRelations;
}

function makeEntidade(membros: Array<{ usuario: { id: string }; papel: string }> = []) {
  return { id: "ent-1", nome: "Test Entidade", slug: "test-entidade", membros };
}

function makeMembro() {
  return {
    id: "membro-1",
    usuario: {
      id: "member-user",
      nome: "Member",
      slug: "member",
      urlFotoPerfil: null,
      eFacade: false,
      curso: { nome: "CC" },
    },
    papel: "MEMBRO",
    cargo: null,
    startedAt: new Date("2024-01-01"),
    endedAt: null,
  };
}

function makeContext(entidadeId: string, membroId: string) {
  return { params: Promise.resolve({ id: entidadeId, membroId }) };
}

function makePutRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/entidades/ent-1/membros/membro-1", {
    method: "PUT",
    headers: {
      Authorization: "Bearer valid-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(): Request {
  return new Request("http://localhost/api/entidades/ent-1/membros/membro-1", {
    method: "DELETE",
    headers: { Authorization: "Bearer valid-token" },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockVerifyToken.mockReturnValue({ sub: "caller-1" });
  mockUserFindById.mockResolvedValue(makeUsuario());
  mockEntidadeFindById.mockResolvedValue(makeEntidade());
  mockFindByEntidadeAndMembro.mockResolvedValue(makeMembro());
  mockCargoExistsInEntidade.mockResolvedValue(true);
  mockMembroUpdate.mockResolvedValue(makeMembro());
  mockMembroDelete.mockResolvedValue(undefined);
});

describe("PUT /api/entidades/[id]/membros/[membroId]", () => {
  it("updates member role successfully", async () => {
    const updatedMembro = { ...makeMembro(), papel: "ADMIN" };
    mockMembroUpdate.mockResolvedValue(updatedMembro);

    const response = await PUT(
      makePutRequest({ papel: "ADMIN" }),
      makeContext("ent-1", "membro-1")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.papel).toBe("ADMIN");
    expect(mockMembroUpdate).toHaveBeenCalledWith(
      "membro-1",
      expect.objectContaining({ papel: "ADMIN" })
    );
  });

  it("allows entity ADMIN to update members", async () => {
    const entityAdmin = makeUsuario({ id: "caller-1", papelPlataforma: "USER" });
    mockUserFindById.mockResolvedValue(entityAdmin);
    mockEntidadeFindById.mockResolvedValue(
      makeEntidade([{ usuario: { id: "caller-1" }, papel: "ADMIN" }])
    );

    const response = await PUT(
      makePutRequest({ papel: "ADMIN" }),
      makeContext("ent-1", "membro-1")
    );

    expect(response.status).toBe(200);
  });

  it("returns 403 for non-admin users", async () => {
    const regularUser = makeUsuario({ id: "caller-1", papelPlataforma: "USER" });
    mockUserFindById.mockResolvedValue(regularUser);
    mockEntidadeFindById.mockResolvedValue(
      makeEntidade([{ usuario: { id: "caller-1" }, papel: "MEMBRO" }])
    );

    const response = await PUT(
      makePutRequest({ papel: "ADMIN" }),
      makeContext("ent-1", "membro-1")
    );

    expect(response.status).toBe(403);
  });

  it("returns 404 when entidade not found", async () => {
    mockEntidadeFindById.mockResolvedValue(null);

    const response = await PUT(
      makePutRequest({ papel: "ADMIN" }),
      makeContext("ent-1", "membro-1")
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 when membership not found", async () => {
    mockFindByEntidadeAndMembro.mockResolvedValue(null);

    const response = await PUT(
      makePutRequest({ papel: "ADMIN" }),
      makeContext("ent-1", "nonexistent")
    );

    expect(response.status).toBe(404);
  });

  it("returns 400 when cargo does not belong to entity", async () => {
    mockCargoExistsInEntidade.mockResolvedValue(false);

    const response = await PUT(
      makePutRequest({ cargoId: "00000000-0000-0000-0000-000000000099" }),
      makeContext("ent-1", "membro-1")
    );

    expect(response.status).toBe(400);
  });

  it("handles date updates", async () => {
    const response = await PUT(
      makePutRequest({
        startedAt: "2023-06-01T00:00:00.000Z",
        endedAt: "2024-01-01T00:00:00.000Z",
      }),
      makeContext("ent-1", "membro-1")
    );

    expect(response.status).toBe(200);
    expect(mockMembroUpdate).toHaveBeenCalledWith(
      "membro-1",
      expect.objectContaining({
        startedAt: expect.any(Date),
        endedAt: expect.any(Date),
      })
    );
  });
});

describe("DELETE /api/entidades/[id]/membros/[membroId]", () => {
  it("deletes membership successfully as platform admin", async () => {
    const response = await DELETE(makeDeleteRequest(), makeContext("ent-1", "membro-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toContain("deletada");
    expect(mockMembroDelete).toHaveBeenCalledWith("membro-1");
  });

  it("deletes membership as entity admin", async () => {
    const entityAdmin = makeUsuario({ id: "caller-1", papelPlataforma: "USER" });
    mockUserFindById.mockResolvedValue(entityAdmin);
    mockEntidadeFindById.mockResolvedValue(
      makeEntidade([{ usuario: { id: "caller-1" }, papel: "ADMIN" }])
    );

    const response = await DELETE(makeDeleteRequest(), makeContext("ent-1", "membro-1"));

    expect(response.status).toBe(200);
  });

  it("returns 403 for non-admin users", async () => {
    const regularUser = makeUsuario({ id: "caller-1", papelPlataforma: "USER" });
    mockUserFindById.mockResolvedValue(regularUser);
    mockEntidadeFindById.mockResolvedValue(makeEntidade());

    const response = await DELETE(makeDeleteRequest(), makeContext("ent-1", "membro-1"));

    expect(response.status).toBe(403);
    expect(mockMembroDelete).not.toHaveBeenCalled();
  });

  it("returns 404 when entidade not found", async () => {
    mockEntidadeFindById.mockResolvedValue(null);

    const response = await DELETE(makeDeleteRequest(), makeContext("ent-1", "membro-1"));

    expect(response.status).toBe(404);
  });

  it("returns 404 when membership not found", async () => {
    mockFindByEntidadeAndMembro.mockResolvedValue(null);

    const response = await DELETE(makeDeleteRequest(), makeContext("ent-1", "nonexistent"));

    expect(response.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    const request = new Request("http://localhost/api/entidades/ent-1/membros/membro-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, makeContext("ent-1", "membro-1"));

    expect(response.status).toBe(401);
  });
});
