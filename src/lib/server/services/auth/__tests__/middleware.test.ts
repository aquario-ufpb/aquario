/**
 * @jest-environment node
 */
import { withAuth, withAdmin, getOptionalUser, canManageVagaForEntidade } from "../middleware";
import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";

// Mock dependencies
const mockFindById = jest.fn();
const mockFindActiveByUsuarioAndEntidade = jest.fn();

jest.mock("@/lib/server/services/jwt/jwt", () => ({
  verifyToken: jest.fn(),
}));

jest.mock("@/lib/server/container", () => ({
  getContainer: () => ({
    usuariosRepository: { findById: mockFindById },
    membrosRepository: { findActiveByUsuarioAndEntidade: mockFindActiveByUsuarioAndEntidade },
  }),
}));

// Import after mocks
import { verifyToken } from "@/lib/server/services/jwt/jwt";

function makeUsuario(overrides: Partial<UsuarioWithRelations> = {}): UsuarioWithRelations {
  return {
    id: "user-1",
    nome: "Test User",
    email: "test@academico.ufpb.br",
    papelPlataforma: "USER",
    centro: { id: "c1", nome: "CI", sigla: "CI", descricao: null, campusId: "campus-1" },
    curso: { id: "k1", nome: "CC", centroId: "c1", criadoEm: new Date(), atualizadoEm: new Date() },
    ...overrides,
  } as UsuarioWithRelations;
}

function makeRequest(token?: string): Request {
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return new Request("http://localhost/api/test", { headers });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("withAuth", () => {
  it("calls handler with user when token is valid", async () => {
    const usuario = makeUsuario();
    (verifyToken as jest.Mock).mockReturnValue({ sub: "user-1" });
    mockFindById.mockResolvedValue(usuario);

    const handler = jest.fn().mockResolvedValue(new Response("ok"));
    const response = await withAuth(makeRequest("valid-token"), handler);

    expect(handler).toHaveBeenCalledWith(expect.any(Request), usuario);
    expect(response.status).toBe(200);
  });

  it("returns 401 when no Authorization header", async () => {
    const handler = jest.fn();
    const response = await withAuth(makeRequest(), handler);

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 401 when token is invalid", async () => {
    (verifyToken as jest.Mock).mockReturnValue(null);

    const handler = jest.fn();
    const response = await withAuth(makeRequest("bad-token"), handler);

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 404 when user is not found in database", async () => {
    (verifyToken as jest.Mock).mockReturnValue({ sub: "deleted-user" });
    mockFindById.mockResolvedValue(null);

    const handler = jest.fn();
    const response = await withAuth(makeRequest("valid-token"), handler);

    expect(response.status).toBe(404);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("withAdmin", () => {
  it("calls handler when user is MASTER_ADMIN", async () => {
    const admin = makeUsuario({ papelPlataforma: "MASTER_ADMIN" });
    (verifyToken as jest.Mock).mockReturnValue({ sub: "user-1" });
    mockFindById.mockResolvedValue(admin);

    const handler = jest.fn().mockResolvedValue(new Response("ok"));
    const response = await withAdmin(makeRequest("valid-token"), handler);

    expect(handler).toHaveBeenCalledWith(expect.any(Request), admin);
    expect(response.status).toBe(200);
  });

  it("returns 403 when user is not MASTER_ADMIN", async () => {
    const regularUser = makeUsuario({ papelPlataforma: "USER" });
    (verifyToken as jest.Mock).mockReturnValue({ sub: "user-1" });
    mockFindById.mockResolvedValue(regularUser);

    const handler = jest.fn();
    const response = await withAdmin(makeRequest("valid-token"), handler);

    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 401 when no token (inherits from withAuth)", async () => {
    const handler = jest.fn();
    const response = await withAdmin(makeRequest(), handler);

    expect(response.status).toBe(401);
  });
});

describe("getOptionalUser", () => {
  it("returns user when valid token is provided", async () => {
    const usuario = makeUsuario();
    (verifyToken as jest.Mock).mockReturnValue({ sub: "user-1" });
    mockFindById.mockResolvedValue(usuario);

    const result = await getOptionalUser(makeRequest("valid-token"));

    expect(result).toBe(usuario);
  });

  it("returns null when no token is provided", async () => {
    const result = await getOptionalUser(makeRequest());

    expect(result).toBeNull();
  });

  it("returns null when token is invalid", async () => {
    (verifyToken as jest.Mock).mockReturnValue(null);

    const result = await getOptionalUser(makeRequest("bad-token"));

    expect(result).toBeNull();
  });
});

describe("canManageVagaForEntidade", () => {
  it("returns true for MASTER_ADMIN regardless of membership", async () => {
    const admin = makeUsuario({ papelPlataforma: "MASTER_ADMIN" });

    const result = await canManageVagaForEntidade(admin, "entidade-1");

    expect(result).toBe(true);
    expect(mockFindActiveByUsuarioAndEntidade).not.toHaveBeenCalled();
  });

  it("returns true when user is ADMIN of the entity", async () => {
    const user = makeUsuario();
    mockFindActiveByUsuarioAndEntidade.mockResolvedValue({ papel: "ADMIN" });

    const result = await canManageVagaForEntidade(user, "entidade-1");

    expect(result).toBe(true);
    expect(mockFindActiveByUsuarioAndEntidade).toHaveBeenCalledWith("user-1", "entidade-1");
  });

  it("returns false when user is MEMBRO (not ADMIN) of the entity", async () => {
    const user = makeUsuario();
    mockFindActiveByUsuarioAndEntidade.mockResolvedValue({ papel: "MEMBRO" });

    const result = await canManageVagaForEntidade(user, "entidade-1");

    expect(result).toBe(false);
  });

  it("returns false when user has no membership in entity", async () => {
    const user = makeUsuario();
    mockFindActiveByUsuarioAndEntidade.mockResolvedValue(null);

    const result = await canManageVagaForEntidade(user, "entidade-1");

    expect(result).toBe(false);
  });
});
