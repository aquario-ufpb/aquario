/* eslint-disable require-await */
import { hash } from "bcryptjs";
import { describe, expect, it, vi } from "vitest";

import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";
import {
  createSigaaReauthPostHandler,
  createSigaaReauthProofService,
  type ISigaaReauthAttemptLimiter,
} from "@/lib/server/services/sigaa/reauth";
import { ErrorCode } from "@/lib/shared/errors";

const SECRET = "sigaa-proof-secret-that-is-long-enough-for-integration";
const NOW = Date.parse("2026-08-21T15:00:00.000Z");

function makeUsuario(senhaHash: string): UsuarioWithRelations {
  return {
    id: "user-1",
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}

describe("POST /api/usuarios/me/sigaa/reauth", () => {
  it("runs the authenticated beta, limiter, bcrypt, and JWT path with fake boundaries", async () => {
    const senhaHash = await hash("correct-password", 4);
    const usuario = makeUsuario(senhaHash);
    const consumeReauthAttempt: ISigaaReauthAttemptLimiter["consumeReauthAttempt"] = async () => ({
      kind: "allowed",
    });
    const limiter: ISigaaReauthAttemptLimiter = {
      consumeReauthAttempt: vi.fn(consumeReauthAttempt),
    };
    const proofService = createSigaaReauthProofService(SECRET, {
      now: () => NOW,
      createJti: () => "550e8400-e29b-41d4-a716-446655440000",
    });
    const post = createSigaaReauthPostHandler({
      limiter,
      getProofService: () => proofService,
      authenticateRequest: async (incomingRequest, handler) => handler(incomingRequest, usuario),
    });

    const successResponse = await post(request("correct-password"));
    const successBody = await successResponse.json();
    const claims = proofService.verifyProof(successBody.proofToken, usuario.id);
    const failureResponse = await post(request("wrong-password"));
    const failureBody = await failureResponse.json();

    expect(successResponse.status).toBe(200);
    expect(successResponse.headers.get("Cache-Control")).toBe("private, no-store");
    expect(claims).toMatchObject({
      sub: usuario.id,
      purpose: "sigaa:reauth",
      authTime: NOW / 1000,
    });
    expect(failureResponse.status).toBe(403);
    expect(failureBody.code).toBe(ErrorCode.SIGAA_REAUTH_FAILED);
    expect(limiter.consumeReauthAttempt).toHaveBeenCalledTimes(2);
  });
});
