/**
 * @jest-environment node
 */
import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";

const mockFindById = jest.fn();
const mockUpdatePapelPlataforma = jest.fn();
const mockVerifyToken = jest.fn();

jest.mock("@/lib/server/services/jwt/jwt", () => ({
  verifyToken: (...args: unknown[]) => mockVerifyToken(...args),
}));

jest.mock("@/lib/server/container", () => ({
  getContainer: () => ({
    usuariosRepository: {
      findById: mockFindById,
      updatePapelPlataforma: mockUpdatePapelPlataforma,
    },
  }),
}));

import { PATCH } from "../route";

function makeUsuario(overrides: Partial<UsuarioWithRelations> = {}): UsuarioWithRelations {
  return {
    id: "user-1",
    nome: "Test User",
    email: "test@academico.ufpb.br",
    papelPlataforma: "MASTER_ADMIN",
    eVerificado: true,
    eFacade: false,
    urlFotoPerfil: null,
    permissoes: [],
    centro: { id: "c1", nome: "CI", sigla: "CI", descricao: null, campusId: "campus-1" },
    curso: { id: "k1", nome: "CC", centroId: "c1", criadoEm: new Date(), atualizadoEm: new Date() },
    ...overrides,
  } as unknown as UsuarioWithRelations;
}

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/usuarios/target-user/role", {
    method: "PATCH",
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

beforeEach(() => {
  jest.clearAllMocks();
  mockVerifyToken.mockReturnValue({ sub: "admin-1" });
  mockUpdatePapelPlataforma.mockResolvedValue(undefined);
});

describe("PATCH /api/usuarios/[id]/role", () => {
  it("updates user role to MASTER_ADMIN", async () => {
    const admin = makeUsuario({ id: "admin-1", papelPlataforma: "MASTER_ADMIN" });
    const target = makeUsuario({ id: "target-user", papelPlataforma: "USER" });
    const updatedTarget = makeUsuario({ id: "target-user", papelPlataforma: "MASTER_ADMIN" });

    mockFindById
      .mockResolvedValueOnce(admin) // withAdmin lookup
      .mockResolvedValueOnce(target) // check target exists
      .mockResolvedValueOnce(updatedTarget); // return updated user

    const response = await PATCH(
      makeRequest({ papelPlataforma: "MASTER_ADMIN" }),
      makeContext("target-user")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.papelPlataforma).toBe("MASTER_ADMIN");
    expect(mockUpdatePapelPlataforma).toHaveBeenCalledWith("target-user", "MASTER_ADMIN");
  });

  it("demotes user from MASTER_ADMIN to USER", async () => {
    const admin = makeUsuario({ id: "admin-1", papelPlataforma: "MASTER_ADMIN" });
    const target = makeUsuario({ id: "target-user", papelPlataforma: "MASTER_ADMIN" });
    const updatedTarget = makeUsuario({ id: "target-user", papelPlataforma: "USER" });

    mockFindById
      .mockResolvedValueOnce(admin)
      .mockResolvedValueOnce(target)
      .mockResolvedValueOnce(updatedTarget);

    const response = await PATCH(
      makeRequest({ papelPlataforma: "USER" }),
      makeContext("target-user")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.papelPlataforma).toBe("USER");
  });

  it("prevents self-demotion", async () => {
    const admin = makeUsuario({ id: "admin-1", papelPlataforma: "MASTER_ADMIN" });
    mockFindById.mockResolvedValue(admin);

    const response = await PATCH(makeRequest({ papelPlataforma: "USER" }), makeContext("admin-1"));

    expect(response.status).toBe(400);
    expect(mockUpdatePapelPlataforma).not.toHaveBeenCalled();
  });

  it("returns 404 when target user does not exist", async () => {
    const admin = makeUsuario({ id: "admin-1", papelPlataforma: "MASTER_ADMIN" });
    mockFindById
      .mockResolvedValueOnce(admin) // withAdmin lookup
      .mockResolvedValueOnce(null); // target not found

    const response = await PATCH(
      makeRequest({ papelPlataforma: "MASTER_ADMIN" }),
      makeContext("nonexistent")
    );

    expect(response.status).toBe(404);
  });

  it("returns 403 when caller is not admin", async () => {
    const regularUser = makeUsuario({ id: "admin-1", papelPlataforma: "USER" });
    mockFindById.mockResolvedValue(regularUser);

    const response = await PATCH(
      makeRequest({ papelPlataforma: "MASTER_ADMIN" }),
      makeContext("target-user")
    );

    expect(response.status).toBe(403);
  });

  it("rejects invalid role values", async () => {
    const admin = makeUsuario({ id: "admin-1", papelPlataforma: "MASTER_ADMIN" });
    mockFindById.mockResolvedValue(admin);

    const response = await PATCH(
      makeRequest({ papelPlataforma: "SUPERADMIN" }),
      makeContext("target-user")
    );

    expect(response.status).toBe(400);
    expect(mockUpdatePapelPlataforma).not.toHaveBeenCalled();
  });
});
