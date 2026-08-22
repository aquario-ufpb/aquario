/**
 * @jest-environment node
 */
/* eslint-disable require-await */
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";
import { ApiError } from "@/lib/server/errors";
import { ErrorCode } from "@/lib/shared/errors";

import {
  createSigaaReauthPostHandler,
  createSigaaReauthProofService,
  SIGAA_REAUTH_AUDIENCE,
  SIGAA_REAUTH_HEADER,
  SIGAA_REAUTH_ISSUER,
  SIGAA_REAUTH_PURPOSE,
  SIGAA_REAUTH_TTL_SECONDS,
  withRecentSigaaProof,
  withSigaaBetaOwner,
  type ISigaaReauthAttemptLimiter,
} from "../reauth";

const SECRET = "sigaa-proof-secret-that-is-long-enough-for-tests";
const OTHER_SECRET = "different-sigaa-secret-that-is-long-enough";
const JTI = "550e8400-e29b-41d4-a716-446655440000";
const NOW = Date.parse("2026-08-21T15:00:00.000Z");

function makeUsuario(overrides: Partial<UsuarioWithRelations> = {}): UsuarioWithRelations {
  return {
    id: "user-1",
    nome: "Test User",
    email: "test@academico.ufpb.br",
    senhaHash: "stored-bcrypt-hash",
    eVerificado: true,
    eFacade: false,
    slug: "test-user",
    urlFotoPerfil: null,
    matricula: null,
    matriculaOrigem: null,
    matriculaVerificadaPeloSigaaEm: null,
    permissoes: ["sigaa:beta"],
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
    ...overrides,
  } as UsuarioWithRelations;
}

function authenticateAs(usuario: UsuarioWithRelations) {
  return async (
    request: Request,
    handler: (request: Request, authenticatedUser: UsuarioWithRelations) => Promise<Response>
  ) => handler(request, usuario);
}

function makeRequest(body: unknown, headers: HeadersInit = {}): Request {
  return new Request("http://localhost/api/usuarios/me/sigaa/reauth", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function allowedLimiter(
  implementation: ISigaaReauthAttemptLimiter["consumeReauthAttempt"] = async () => ({
    kind: "allowed",
  })
): ISigaaReauthAttemptLimiter {
  return { consumeReauthAttempt: jest.fn(implementation) };
}

describe("SIGAA reauthentication proof", () => {
  it("issues an HS256 proof with the closed 15-minute claim set", () => {
    const service = createSigaaReauthProofService(SECRET, {
      now: () => NOW,
      createJti: () => JTI,
    });

    const proof = service.issueProof("user-1");
    const claims = service.verifyProof(proof.proofToken, "user-1");

    expect(claims).toEqual({
      iss: SIGAA_REAUTH_ISSUER,
      aud: SIGAA_REAUTH_AUDIENCE,
      sub: "user-1",
      purpose: SIGAA_REAUTH_PURPOSE,
      jti: JTI,
      authTime: NOW / 1000,
      iat: NOW / 1000,
      exp: NOW / 1000 + SIGAA_REAUTH_TTL_SECONDS,
    });
    expect(proof.expiresAt).toBe("2026-08-21T15:15:00.000Z");
  });

  it("binds a confirmation proof to one concrete proposal", () => {
    const service = createSigaaReauthProofService(SECRET, {
      now: () => NOW,
      createJti: () => JTI,
    });
    const proposalId = "550e8400-e29b-41d4-a716-446655440010";

    const proof = service.issueProof("user-1", proposalId);

    expect(service.verifyProof(proof.proofToken, "user-1")).toMatchObject({ proposalId });
  });

  it("rejects another subject, another secret, another purpose, and another algorithm", () => {
    const service = createSigaaReauthProofService(SECRET, {
      now: () => NOW,
      createJti: () => JTI,
    });
    const proof = service.issueProof("user-1");

    expect(service.verifyProof(proof.proofToken, "user-2")).toBeNull();
    expect(
      createSigaaReauthProofService(OTHER_SECRET, { now: () => NOW }).verifyProof(
        proof.proofToken,
        "user-1"
      )
    ).toBeNull();

    const commonClaims = {
      authTime: NOW / 1000,
      iat: NOW / 1000,
    };
    const wrongPurpose = jwt.sign({ ...commonClaims, purpose: "ordinary-auth" }, SECRET, {
      algorithm: "HS256",
      issuer: SIGAA_REAUTH_ISSUER,
      audience: SIGAA_REAUTH_AUDIENCE,
      subject: "user-1",
      jwtid: JTI,
      expiresIn: SIGAA_REAUTH_TTL_SECONDS,
    });
    const wrongAlgorithm = jwt.sign({ ...commonClaims, purpose: SIGAA_REAUTH_PURPOSE }, SECRET, {
      algorithm: "HS512",
      issuer: SIGAA_REAUTH_ISSUER,
      audience: SIGAA_REAUTH_AUDIENCE,
      subject: "user-1",
      jwtid: JTI,
      expiresIn: SIGAA_REAUTH_TTL_SECONDS,
    });

    expect(service.verifyProof(wrongPurpose, "user-1")).toBeNull();
    expect(service.verifyProof(wrongAlgorithm, "user-1")).toBeNull();
  });

  it("rejects a proof after exactly 15 minutes", () => {
    let currentTime = NOW;
    const service = createSigaaReauthProofService(SECRET, {
      now: () => currentTime,
      createJti: () => JTI,
    });
    const proof = service.issueProof("user-1");

    currentTime += SIGAA_REAUTH_TTL_SECONDS * 1000;

    expect(service.verifyProof(proof.proofToken, "user-1")).toBeNull();
  });
});

describe("SIGAA reauthentication route handler", () => {
  const proofService = createSigaaReauthProofService(SECRET, {
    now: () => NOW,
    createJti: () => JTI,
  });

  it("consumes the distributed budget before comparing the password", async () => {
    const order: string[] = [];
    const limiter = allowedLimiter(async () => {
      order.push("limit");
      return { kind: "allowed" };
    });
    const comparePassword = jest.fn(async () => {
      order.push("bcrypt");
      return true;
    });
    const post = createSigaaReauthPostHandler({
      limiter,
      getProofService: () => proofService,
      authenticateRequest: authenticateAs(makeUsuario()),
      comparePassword,
    });

    const response = await post(makeRequest({ password: "aquario-password" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(order).toEqual(["limit", "bcrypt"]);
    expect(limiter.consumeReauthAttempt).toHaveBeenCalledWith({ usuarioId: "user-1" });
    expect(comparePassword).toHaveBeenCalledWith("aquario-password", "stored-bcrypt-hash");
    expect(body).toEqual({
      proofToken: expect.any(String),
      expiresAt: "2026-08-21T15:15:00.000Z",
    });
    expect(JSON.stringify(body)).not.toContain("aquario-password");
    expect(JSON.stringify(body)).not.toContain("stored-bcrypt-hash");
  });

  it("does not compare a password after the limiter rejects the attempt", async () => {
    const comparePassword = jest.fn(async () => true);
    const post = createSigaaReauthPostHandler({
      limiter: allowedLimiter(async () => ({
        kind: "limited",
        retryAfter: "Fri, 21 Aug 2026 15:00:42 GMT",
      })),
      getProofService: () => proofService,
      authenticateRequest: authenticateAs(makeUsuario()),
      comparePassword,
    });

    const response = await post(makeRequest({ password: "aquario-password" }));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("Fri, 21 Aug 2026 15:00:42 GMT");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(body.code).toBe(ErrorCode.SIGAA_REAUTH_RATE_LIMITED);
    expect(comparePassword).not.toHaveBeenCalled();
  });

  it("uses 403 for a bad Aquário password", async () => {
    const post = createSigaaReauthPostHandler({
      limiter: allowedLimiter(),
      getProofService: () => proofService,
      authenticateRequest: authenticateAs(makeUsuario()),
      comparePassword: async () => false,
    });

    const response = await post(makeRequest({ password: "wrong-password" }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe(ErrorCode.SIGAA_REAUTH_FAILED);
  });

  it("keeps normal bearer failures as 401", async () => {
    const limiter = allowedLimiter();
    const post = createSigaaReauthPostHandler({
      limiter,
      getProofService: () => proofService,
      authenticateRequest: async () => ApiError.tokenInvalid(),
    });

    const response = await post(makeRequest({ password: "aquario-password" }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(body.code).toBe(ErrorCode.TOKEN_INVALID);
    expect(limiter.consumeReauthAttempt).not.toHaveBeenCalled();
  });

  it("fails before the limiter for users outside the beta or without a password hash", async () => {
    const limiter = allowedLimiter();
    const outsideBeta = createSigaaReauthPostHandler({
      limiter,
      getProofService: () => proofService,
      authenticateRequest: authenticateAs(makeUsuario({ permissoes: [] })),
    });
    const facadeBeta = createSigaaReauthPostHandler({
      limiter,
      getProofService: () => proofService,
      authenticateRequest: authenticateAs(makeUsuario({ senhaHash: null })),
    });

    const outsideBetaResponse = await outsideBeta(makeRequest({ password: "password" }));
    const facadeResponse = await facadeBeta(makeRequest({ password: "password" }));

    expect(outsideBetaResponse.status).toBe(403);
    expect((await outsideBetaResponse.json()).code).toBe(ErrorCode.SIGAA_BETA_REQUIRED);
    expect(facadeResponse.status).toBe(403);
    expect((await facadeResponse.json()).code).toBe(ErrorCode.SIGAA_REAUTH_FAILED);
    expect(limiter.consumeReauthAttempt).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON and extra request fields", async () => {
    const limiter = allowedLimiter();
    const post = createSigaaReauthPostHandler({
      limiter,
      getProofService: () => proofService,
      authenticateRequest: authenticateAs(makeUsuario()),
    });
    const malformed = new Request("http://localhost/api/usuarios/me/sigaa/reauth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });

    const malformedResponse = await post(malformed);
    const extraFieldResponse = await post(
      makeRequest({ password: "password", usuarioId: "another-user" })
    );

    expect(malformedResponse.status).toBe(400);
    expect(extraFieldResponse.status).toBe(400);
    expect(limiter.consumeReauthAttempt).not.toHaveBeenCalled();
  });

  it("maps an unavailable limiter or proof issuer to a closed 503", async () => {
    const unavailableLimiter = allowedLimiter(async () => {
      throw new Error("database detail that must stay private");
    });
    const post = createSigaaReauthPostHandler({
      limiter: unavailableLimiter,
      getProofService: () => proofService,
      authenticateRequest: authenticateAs(makeUsuario()),
    });

    const response = await post(makeRequest({ password: "password" }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      message: "A reautenticação SIGAA está temporariamente indisponível.",
      code: ErrorCode.SIGAA_REAUTH_UNAVAILABLE,
    });
    expect(JSON.stringify(body)).not.toContain("database detail");
  });
});

describe("recent SIGAA proof wrapper", () => {
  const proofService = createSigaaReauthProofService(SECRET, {
    now: () => NOW,
    createJti: () => JTI,
  });

  it("passes only a subject-bound recent owner to the protected handler", async () => {
    const proof = proofService.issueProof("user-1");
    const request = makeRequest(
      {},
      {
        [SIGAA_REAUTH_HEADER]: proof.proofToken,
      }
    );
    const protectedHandler = jest.fn(async (_request, owner) => NextResponse.json(owner));

    const response = await withRecentSigaaProof(
      request,
      proofService,
      protectedHandler,
      authenticateAs(makeUsuario())
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      usuarioId: "user-1",
      authTime: NOW / 1000,
      proposalId: null,
      proofJti: JTI,
    });
    expect(body).not.toHaveProperty("passwordHash");
  });

  it("rejects missing proofs and proofs issued for another user", async () => {
    const missingResponse = await withRecentSigaaProof(
      makeRequest({}),
      proofService,
      async () => NextResponse.json({ ok: true }),
      authenticateAs(makeUsuario())
    );
    const wrongSubjectProof = proofService.issueProof("user-2");
    const wrongSubjectResponse = await withRecentSigaaProof(
      makeRequest({}, { [SIGAA_REAUTH_HEADER]: wrongSubjectProof.proofToken }),
      proofService,
      async () => NextResponse.json({ ok: true }),
      authenticateAs(makeUsuario())
    );

    expect(missingResponse.status).toBe(403);
    expect((await missingResponse.json()).code).toBe(ErrorCode.SIGAA_REAUTH_REQUIRED);
    expect(wrongSubjectResponse.status).toBe(403);
    expect((await wrongSubjectResponse.json()).code).toBe(ErrorCode.SIGAA_REAUTH_INVALID);
  });
});

describe("SIGAA beta wrapper", () => {
  it("passes only the beta identity and does not expose the password hash", async () => {
    const response = await withSigaaBetaOwner(
      makeRequest({}),
      (_request, owner) => Promise.resolve(NextResponse.json(owner)),
      authenticateAs(makeUsuario({ senhaHash: null }))
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ usuarioId: "user-1" });
    expect(body).not.toHaveProperty("passwordHash");
  });
});
