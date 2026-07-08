/**
 * @jest-environment node
 */
import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";

const mockFindById = jest.fn();
const mockFindManyPaginated = jest.fn();
const mockVerifyToken = jest.fn();

jest.mock("@/lib/server/services/jwt/jwt", () => ({
  verifyToken: (...args: unknown[]) => mockVerifyToken(...args),
}));

jest.mock("@/lib/server/container", () => ({
  getContainer: () => ({
    usuariosRepository: {
      findById: mockFindById,
    },
    auditLogsRepository: {
      findManyPaginated: mockFindManyPaginated,
    },
  }),
}));

import { GET } from "../route";

function makeUsuario(overrides: Partial<UsuarioWithRelations> = {}): UsuarioWithRelations {
  return {
    id: "admin-1",
    nome: "Admin User",
    email: "admin@academico.ufpb.br",
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

function makeRequest(url = "http://localhost/api/admin/audit-logs?page=2&limit=10") {
  return new Request(url, {
    method: "GET",
    headers: { Authorization: "Bearer valid-token" },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockVerifyToken.mockReturnValue({ sub: "admin-1" });
  mockFindById.mockResolvedValue(makeUsuario());
  mockFindManyPaginated.mockResolvedValue({
    auditLogs: [
      {
        id: "audit-1",
        actorUsuarioId: "admin-1",
        action: "usuario.role.updated",
        resourceType: "usuario",
        resourceId: "target-user",
        metadata: { previousRole: "USER", newRole: "MASTER_ADMIN" },
        ipAddress: null,
        userAgent: null,
        criadoEm: new Date("2026-07-08T10:00:00Z"),
        actorUsuario: {
          id: "admin-1",
          nome: "Admin User",
          email: "admin@academico.ufpb.br",
        },
      },
    ],
    total: 1,
  });
});

describe("GET /api/admin/audit-logs", () => {
  it("lists audit logs for master admins", async () => {
    const response = await GET(
      makeRequest(
        "http://localhost/api/admin/audit-logs?page=2&limit=10&action=usuario.role.updated&resourceType=usuario"
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.auditLogs).toHaveLength(1);
    expect(body.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
    expect(mockFindManyPaginated).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      action: "usuario.role.updated",
      resourceType: "usuario",
      actorUsuarioId: undefined,
    });
  });

  it("returns 403 when caller is not a master admin", async () => {
    mockFindById.mockResolvedValue(makeUsuario({ papelPlataforma: "USER" }));

    const response = await GET(makeRequest());

    expect(response.status).toBe(403);
    expect(mockFindManyPaginated).not.toHaveBeenCalled();
  });
});
