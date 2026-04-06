/**
 * @jest-environment node
 */
import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";

const mockFindById = jest.fn();
const mockDelete = jest.fn();
const mockVerifyToken = jest.fn();

jest.mock("@/lib/server/services/jwt/jwt", () => ({
  verifyToken: (...args: unknown[]) => mockVerifyToken(...args),
}));

jest.mock("@/lib/server/container", () => ({
  getContainer: () => ({
    usuariosRepository: {
      findById: mockFindById,
      delete: mockDelete,
    },
  }),
}));

// Import after mocks
import { DELETE } from "../route";

function makeUsuario(overrides: Partial<UsuarioWithRelations> = {}): UsuarioWithRelations {
  return {
    id: "user-1",
    nome: "Test User",
    email: "test@academico.ufpb.br",
    papelPlataforma: "MASTER_ADMIN",
    eFacade: false,
    centro: { id: "c1", nome: "CI", sigla: "CI", descricao: null, campusId: "campus-1" },
    curso: { id: "k1", nome: "CC", centroId: "c1", criadoEm: new Date(), atualizadoEm: new Date() },
    ...overrides,
  } as unknown as UsuarioWithRelations;
}

function makeRequest(): Request {
  return new Request("http://localhost/api/usuarios/target-user", {
    method: "DELETE",
    headers: { Authorization: "Bearer valid-token" },
  });
}

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockVerifyToken.mockReturnValue({ sub: "admin-1" });
  mockDelete.mockResolvedValue(undefined);
});

describe("DELETE /api/usuarios/[id]", () => {
  it("deletes user successfully as admin", async () => {
    const admin = makeUsuario({ id: "admin-1", papelPlataforma: "MASTER_ADMIN" });
    const target = makeUsuario({ id: "target-user" });

    mockFindById.mockImplementation((id: string) => {
      if (id === "admin-1") return Promise.resolve(admin);
      if (id === "target-user") return Promise.resolve(target);
      return Promise.resolve(null);
    });

    const response = await DELETE(makeRequest(), makeContext("target-user"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toContain("deletado");
    expect(mockDelete).toHaveBeenCalledWith("target-user");
  });

  it("prevents self-deletion", async () => {
    const admin = makeUsuario({ id: "admin-1", papelPlataforma: "MASTER_ADMIN" });
    mockFindById.mockResolvedValue(admin);

    const response = await DELETE(makeRequest(), makeContext("admin-1"));

    expect(response.status).toBe(400);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("returns 404 when target user does not exist", async () => {
    const admin = makeUsuario({ id: "admin-1", papelPlataforma: "MASTER_ADMIN" });
    mockFindById.mockImplementation((id: string) => {
      if (id === "admin-1") return Promise.resolve(admin);
      return Promise.resolve(null);
    });

    const response = await DELETE(makeRequest(), makeContext("nonexistent"));

    expect(response.status).toBe(404);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("returns 401 when no token provided", async () => {
    const request = new Request("http://localhost/api/usuarios/target-user", {
      method: "DELETE",
    });

    const response = await DELETE(request, makeContext("target-user"));

    expect(response.status).toBe(401);
  });

  it("returns 403 when user is not admin", async () => {
    const regularUser = makeUsuario({ id: "admin-1", papelPlataforma: "USER" });
    mockFindById.mockResolvedValue(regularUser);

    const response = await DELETE(makeRequest(), makeContext("target-user"));

    expect(response.status).toBe(403);
  });
});
