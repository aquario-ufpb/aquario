/**
 * @jest-environment node
 */
/* eslint-disable require-await */
import { hash } from "bcryptjs";

import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";
import { ErrorCode } from "@/lib/shared/errors";

const mockConsumeRateLimit = jest.fn();
const mockWithAuth = jest.fn();
let mockUsuario: UsuarioWithRelations;

jest.mock("@/lib/server/container", () => ({
  getContainer: () => ({
    sigaaRepository: {
      consumeRateLimit: (...args: unknown[]) => mockConsumeRateLimit(...args),
    },
  }),
}));

jest.mock("@/lib/server/services/auth/middleware", () => ({
  withAuth: (...args: unknown[]) => mockWithAuth(...args),
}));

import { POST } from "../route";

const USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const REAUTH_SECRET = "route-test-reauth-secret-that-is-long-enough";

function makeUsuario(senhaHash: string): UsuarioWithRelations {
  return {
    id: USER_ID,
    nome: "Test User",
    email: "test@academico.ufpb.br",
    senhaHash,
    eVerificado: true,
    eFacade: false,
    slug: "test-user",
    urlFotoPerfil: null,
    matricula: null,
    matriculaOrigem: null,
    matriculaVerificadaPeloSigaaEm: null,
    permissoes: [],
    papelPlataforma: "USER",
    periodoAtual: null,
    onboardingMetadata: null,
    centroId: "centro-1",
    cursoId: "curso-1",
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    centro: { id: "centro-1", nome: "CI", sigla: "CI", descricao: null, campusId: "campus-1" },
    curso: {
      id: "curso-1",
      nome: "CC",
      centroId: "centro-1",
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    },
  } as UsuarioWithRelations;
}

function request(password: string): Request {
  return new Request("http://localhost/api/usuarios/me/sigaa/reauth", {
    method: "POST",
    headers: {
      Authorization: "Bearer normal-aquario-jwt",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });
}

describe("POST /api/usuarios/me/sigaa/reauth export", () => {
  const originalSecret = process.env.SIGAA_REAUTH_JWT_SECRET;
  const originalJwtSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.SIGAA_REAUTH_JWT_SECRET = REAUTH_SECRET;
    process.env.JWT_SECRET = "ordinary-jwt-secret-that-differs-from-reauth";
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.SIGAA_REAUTH_JWT_SECRET;
    } else {
      process.env.SIGAA_REAUTH_JWT_SECRET = originalSecret;
    }

    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    mockUsuario = makeUsuario(await hash("correct-password", 4));
    mockWithAuth.mockImplementation((incomingRequest, handler) =>
      handler(incomingRequest, mockUsuario)
    );
  });

  it("uses the real repository limiter adapter and returns a proof", async () => {
    mockConsumeRateLimit.mockResolvedValue({
      kind: "allowed",
      remaining: 4,
      resetAt: new Date("2026-08-21T15:01:00.000Z"),
    });

    const response = await POST(request("correct-password"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.status).not.toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(body).toEqual({
      proofToken: expect.any(String),
      expiresAt: expect.any(String),
    });
    expect(mockConsumeRateLimit).toHaveBeenCalledWith({
      ownerId: USER_ID,
      operation: "REAUTH",
    });
  });

  it("maps retryAt from the repository to Retry-After", async () => {
    const now = Date.parse("2026-08-21T15:00:00.000Z");
    mockConsumeRateLimit.mockResolvedValue({
      kind: "rate_limited",
      retryAt: new Date(now + 42_100),
    });

    const response = await POST(request("correct-password"));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("Fri, 21 Aug 2026 15:00:42 GMT");
    expect(body.code).toBe(ErrorCode.SIGAA_REAUTH_RATE_LIMITED);
  });
});
