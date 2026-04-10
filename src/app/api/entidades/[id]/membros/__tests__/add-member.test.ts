/**
 * @jest-environment node
 */
import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";

const mockVerifyToken = jest.fn();
const mockUserFindById = jest.fn();
const mockEntidadeFindById = jest.fn();
const mockUsuarioExists = jest.fn();
const mockFindActiveByUsuarioAndEntidade = jest.fn();
const mockCargoExistsInEntidade = jest.fn();
const mockMembroCreate = jest.fn();

jest.mock("@/lib/server/services/jwt/jwt", () => ({
  verifyToken: (...args: unknown[]) => mockVerifyToken(...args),
}));

jest.mock("@/lib/server/container", () => ({
  getContainer: () => ({
    usuariosRepository: { findById: mockUserFindById },
    entidadesRepository: { findById: mockEntidadeFindById },
    membrosRepository: {
      usuarioExists: mockUsuarioExists,
      findActiveByUsuarioAndEntidade: mockFindActiveByUsuarioAndEntidade,
      cargoExistsInEntidade: mockCargoExistsInEntidade,
      create: mockMembroCreate,
    },
  }),
}));

import { POST } from "../route";

function makeUsuario(overrides: Partial<UsuarioWithRelations> = {}): UsuarioWithRelations {
  return {
    id: "caller-1",
    nome: "Caller",
    email: "caller@academico.ufpb.br",
    papelPlataforma: "MASTER_ADMIN",
    eFacade: false,
    centro: { id: "c1", nome: "CI", sigla: "CI", descricao: null, campusId: "campus-1" },
    curso: { id: "k1", nome: "CC", centroId: "c1", criadoEm: new Date(), atualizadoEm: new Date() },
    ...overrides,
  } as unknown as UsuarioWithRelations;
}

function makeEntidade(membros: Array<{ usuario: { id: string }; papel: string }> = []) {
  return {
    id: "ent-1",
    nome: "Test Entidade",
    slug: "test-entidade",
    membros,
  };
}

function makeCreatedMembro() {
  return {
    id: "new-membro-1",
    usuario: {
      id: "new-user-1",
      nome: "New Member",
      slug: "new-member",
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

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/entidades/ent-1/membros", {
    method: "POST",
    headers: {
      Authorization: "Bearer valid-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

const validBody = {
  usuarioId: "00000000-0000-0000-0000-000000000001",
  papel: "MEMBRO" as const,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockVerifyToken.mockReturnValue({ sub: "caller-1" });
  mockUserFindById.mockResolvedValue(makeUsuario());
  mockEntidadeFindById.mockResolvedValue(makeEntidade());
  mockUsuarioExists.mockResolvedValue(true);
  mockFindActiveByUsuarioAndEntidade.mockResolvedValue(null);
  mockCargoExistsInEntidade.mockResolvedValue(true);
  mockMembroCreate.mockResolvedValue(makeCreatedMembro());
});

describe("POST /api/entidades/[id]/membros", () => {
  it("adds member successfully as MASTER_ADMIN", async () => {
    const response = await POST(makeRequest(validBody), makeContext("ent-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe("new-membro-1");
    expect(body.papel).toBe("MEMBRO");
    expect(mockMembroCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: validBody.usuarioId,
        entidadeId: "ent-1",
        papel: "MEMBRO",
      })
    );
  });

  it("adds member as entity ADMIN (not platform admin)", async () => {
    const entityAdmin = makeUsuario({ id: "caller-1", papelPlataforma: "USER" });
    mockUserFindById.mockResolvedValue(entityAdmin);
    mockEntidadeFindById.mockResolvedValue(
      makeEntidade([{ usuario: { id: "caller-1" }, papel: "ADMIN" }])
    );

    const response = await POST(makeRequest(validBody), makeContext("ent-1"));

    expect(response.status).toBe(200);
  });

  it("returns 403 when user is neither platform admin nor entity admin", async () => {
    const regularUser = makeUsuario({ id: "caller-1", papelPlataforma: "USER" });
    mockUserFindById.mockResolvedValue(regularUser);
    mockEntidadeFindById.mockResolvedValue(
      makeEntidade([{ usuario: { id: "caller-1" }, papel: "MEMBRO" }])
    );

    const response = await POST(makeRequest(validBody), makeContext("ent-1"));

    expect(response.status).toBe(403);
    expect(mockMembroCreate).not.toHaveBeenCalled();
  });

  it("returns 404 when entidade does not exist", async () => {
    mockEntidadeFindById.mockResolvedValue(null);

    const response = await POST(makeRequest(validBody), makeContext("nonexistent"));

    expect(response.status).toBe(404);
  });

  it("returns 404 when target user does not exist", async () => {
    mockUsuarioExists.mockResolvedValue(false);

    const response = await POST(makeRequest(validBody), makeContext("ent-1"));

    expect(response.status).toBe(404);
  });

  it("returns 409 when user is already an active member", async () => {
    mockFindActiveByUsuarioAndEntidade.mockResolvedValue({ id: "existing-membro" });

    const response = await POST(makeRequest(validBody), makeContext("ent-1"));

    expect(response.status).toBe(409);
  });

  it("returns 400 when cargo does not belong to entity", async () => {
    mockCargoExistsInEntidade.mockResolvedValue(false);

    const response = await POST(
      makeRequest({ ...validBody, cargoId: "00000000-0000-0000-0000-000000000099" }),
      makeContext("ent-1")
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 on invalid input (missing papel)", async () => {
    const response = await POST(
      makeRequest({ usuarioId: "00000000-0000-0000-0000-000000000001" }),
      makeContext("ent-1")
    );

    expect(response.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    const request = new Request("http://localhost/api/entidades/ent-1/membros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    });

    const response = await POST(request, makeContext("ent-1"));

    expect(response.status).toBe(401);
  });
});
