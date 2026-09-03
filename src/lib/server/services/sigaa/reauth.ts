import { randomUUID } from "crypto";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { z } from "zod";

import { sigaaReauthRequestSchema } from "@/lib/server/api-schemas/sigaa";
import { readSigaaReauthEnvironment } from "@/lib/server/config/sigaa-env";
import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";
import { ApiError, fromZodError } from "@/lib/server/errors";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { ErrorCode } from "@/lib/shared/errors";

export const SIGAA_REAUTH_HEADER = "X-Sigaa-Reauth-Token";
export const SIGAA_REAUTH_ISSUER = "aquario";
export const SIGAA_REAUTH_AUDIENCE = "aquario:sigaa";
export const SIGAA_REAUTH_PURPOSE = "sigaa:reauth";
export const SIGAA_REAUTH_TTL_SECONDS = 15 * 60;

const sigaaOwnerBrand: unique symbol = Symbol("SigaaOwner");
const sigaaReauthOwnerBrand: unique symbol = Symbol("SigaaReauthOwner");
const recentlyReauthenticatedOwnerBrand: unique symbol = Symbol(
  "RecentlyReauthenticatedSigaaOwner"
);

export type SigaaOwner = Readonly<{
  usuarioId: string;
  [sigaaOwnerBrand]: true;
}>;

export type SigaaReauthOwner = Readonly<{
  usuarioId: string;
  passwordHash: string;
  [sigaaReauthOwnerBrand]: true;
}>;

export type RecentlyReauthenticatedSigaaOwner = Readonly<{
  usuarioId: string;
  authTime: number;
  proposalId: string | null;
  proofJti: string;
  [recentlyReauthenticatedOwnerBrand]: true;
}>;

const sigaaProofClaimsSchema = z
  .object({
    iss: z.literal(SIGAA_REAUTH_ISSUER),
    aud: z.literal(SIGAA_REAUTH_AUDIENCE),
    sub: z.string().min(1),
    purpose: z.literal(SIGAA_REAUTH_PURPOSE),
    jti: z.string().uuid(),
    authTime: z.number().int().nonnegative(),
    proposalId: z.string().uuid().optional(),
    iat: z.number().int().nonnegative(),
    exp: z.number().int().positive(),
  })
  .strict()
  .superRefine((claims, context) => {
    if (claims.authTime !== claims.iat) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "authTime must equal iat",
      });
    }

    if (claims.exp - claims.iat !== SIGAA_REAUTH_TTL_SECONDS) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "SIGAA proof must expire after 15 minutes",
      });
    }
  });

export type SigaaProofClaims = Readonly<z.infer<typeof sigaaProofClaimsSchema>>;

export type SigaaReauthProof = Readonly<{
  proofToken: string;
  expiresAt: string;
}>;

export type SigaaReauthProofService = Readonly<{
  issueProof(usuarioId: string, proposalId?: string): SigaaReauthProof;
  verifyProof(token: string, expectedUsuarioId: string): SigaaProofClaims | null;
}>;

export type SigaaReauthLimitResult =
  | Readonly<{ kind: "allowed" }>
  | Readonly<{ kind: "limited"; retryAfter: string }>;

/** PostgreSQL-backed in production so the budget is shared by all server instances. */
export type ISigaaReauthAttemptLimiter = Readonly<{
  consumeReauthAttempt(input: Readonly<{ usuarioId: string }>): Promise<SigaaReauthLimitResult>;
}>;

export type SigaaReauthResult =
  | Readonly<{ kind: "issued"; proof: SigaaReauthProof }>
  | Readonly<{ kind: "password_invalid" }>
  | Readonly<{ kind: "rate_limited"; retryAfter: string }>;

type AuthenticateRequest = (
  request: Request,
  handler: (request: Request, usuario: UsuarioWithRelations) => Promise<Response>
) => Promise<Response>;

type ComparePassword = (password: string, passwordHash: string) => Promise<boolean>;

type ReauthPostDependencies = Readonly<{
  limiter: ISigaaReauthAttemptLimiter;
  getProofService: () => SigaaReauthProofService;
  authenticateRequest?: AuthenticateRequest;
  comparePassword?: ComparePassword;
}>;

type ProofServiceOptions = Readonly<{
  now?: () => number;
  createJti?: () => string;
}>;

export function createSigaaReauthProofService(
  secret: string,
  options: ProofServiceOptions = {}
): SigaaReauthProofService {
  if (secret.length < 32) {
    throw new Error("SIGAA reauthentication JWT secret is invalid");
  }

  const now = options.now ?? Date.now;
  const createJti = options.createJti ?? randomUUID;

  return {
    issueProof(usuarioId, proposalId) {
      const authTime = Math.floor(now() / 1000);
      const proofToken = jwt.sign(
        {
          purpose: SIGAA_REAUTH_PURPOSE,
          authTime,
          iat: authTime,
          ...(proposalId ? { proposalId } : {}),
        },
        secret,
        {
          algorithm: "HS256",
          issuer: SIGAA_REAUTH_ISSUER,
          audience: SIGAA_REAUTH_AUDIENCE,
          subject: usuarioId,
          jwtid: createJti(),
          expiresIn: SIGAA_REAUTH_TTL_SECONDS,
        }
      );

      return {
        proofToken,
        expiresAt: new Date((authTime + SIGAA_REAUTH_TTL_SECONDS) * 1000).toISOString(),
      };
    },

    verifyProof(token, expectedUsuarioId) {
      try {
        const decoded = jwt.verify(token, secret, {
          algorithms: ["HS256"],
          issuer: SIGAA_REAUTH_ISSUER,
          audience: SIGAA_REAUTH_AUDIENCE,
          clockTimestamp: Math.floor(now() / 1000),
          maxAge: SIGAA_REAUTH_TTL_SECONDS,
        });
        const parsed = sigaaProofClaimsSchema.safeParse(decoded);

        if (!parsed.success || parsed.data.sub !== expectedUsuarioId) {
          return null;
        }

        return parsed.data;
      } catch {
        return null;
      }
    },
  };
}

export function createSigaaReauthProofServiceFromEnvironment(): SigaaReauthProofService {
  const { jwtSecret } = readSigaaReauthEnvironment();
  return createSigaaReauthProofService(jwtSecret);
}

function makeSigaaOwner(usuario: UsuarioWithRelations): SigaaOwner {
  return {
    usuarioId: usuario.id,
    [sigaaOwnerBrand]: true,
  };
}

function makeSigaaReauthOwner(usuario: UsuarioWithRelations): SigaaReauthOwner | null {
  if (!usuario.senhaHash) {
    return null;
  }

  return {
    usuarioId: usuario.id,
    passwordHash: usuario.senhaHash,
    [sigaaReauthOwnerBrand]: true,
  };
}

function makeRecentlyReauthenticatedOwner(
  claims: SigaaProofClaims
): RecentlyReauthenticatedSigaaOwner {
  return {
    usuarioId: claims.sub,
    authTime: claims.authTime,
    proposalId: claims.proposalId ?? null,
    proofJti: claims.jti,
    [recentlyReauthenticatedOwnerBrand]: true,
  };
}

export function privateSigaaResponse(response: Response): Response {
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export async function withSigaaOwner(
  request: Request,
  handler: (request: Request, owner: SigaaOwner) => Promise<Response>,
  authenticateRequest: AuthenticateRequest = withAuth
): Promise<Response> {
  const response = await authenticateRequest(request, (authenticatedRequest, usuario) =>
    handler(authenticatedRequest, makeSigaaOwner(usuario))
  );

  return privateSigaaResponse(response);
}

async function withSigaaReauthOwner(
  request: Request,
  handler: (request: Request, owner: SigaaReauthOwner) => Promise<Response>,
  authenticateRequest: AuthenticateRequest = withAuth
): Promise<Response> {
  const response = await authenticateRequest(request, (authenticatedRequest, usuario) => {
    const owner = makeSigaaReauthOwner(usuario);

    if (!owner) {
      return Promise.resolve(
        ApiError.forbidden(
          "Não foi possível reautenticar esta conta.",
          ErrorCode.SIGAA_REAUTH_FAILED
        )
      );
    }

    return handler(authenticatedRequest, owner);
  });

  return privateSigaaResponse(response);
}

export function withRecentSigaaProof(
  request: Request,
  proofService: SigaaReauthProofService,
  handler: (request: Request, owner: RecentlyReauthenticatedSigaaOwner) => Promise<Response>,
  authenticateRequest: AuthenticateRequest = withAuth
): Promise<Response> {
  return withSigaaOwner(
    request,
    (authenticatedRequest, owner) => {
      const proofToken = authenticatedRequest.headers.get(SIGAA_REAUTH_HEADER)?.trim();

      if (!proofToken) {
        return Promise.resolve(
          ApiError.forbidden(
            "Reautenticação recente do Aquário é obrigatória.",
            ErrorCode.SIGAA_REAUTH_REQUIRED
          )
        );
      }

      const claims = proofService.verifyProof(proofToken, owner.usuarioId);

      if (!claims) {
        return Promise.resolve(
          ApiError.forbidden(
            "A reautenticação do Aquário é inválida ou expirou.",
            ErrorCode.SIGAA_REAUTH_INVALID
          )
        );
      }

      return handler(authenticatedRequest, makeRecentlyReauthenticatedOwner(claims));
    },
    authenticateRequest
  );
}

export async function reauthenticateForSigaa(
  input: Readonly<{ owner: SigaaReauthOwner; password: string; proposalId?: string }>,
  dependencies: Readonly<{
    limiter: ISigaaReauthAttemptLimiter;
    proofIssuer: Pick<SigaaReauthProofService, "issueProof">;
    comparePassword?: ComparePassword;
  }>
): Promise<SigaaReauthResult> {
  const limitResult = await dependencies.limiter.consumeReauthAttempt({
    usuarioId: input.owner.usuarioId,
  });

  if (limitResult.kind === "limited") {
    return {
      kind: "rate_limited",
      retryAfter: limitResult.retryAfter,
    };
  }

  const comparePassword = dependencies.comparePassword ?? compare;
  const passwordMatches = await comparePassword(input.password, input.owner.passwordHash);

  if (!passwordMatches) {
    return { kind: "password_invalid" };
  }

  return {
    kind: "issued",
    proof: input.proposalId
      ? dependencies.proofIssuer.issueProof(input.owner.usuarioId, input.proposalId)
      : dependencies.proofIssuer.issueProof(input.owner.usuarioId),
  };
}

export function createSigaaReauthPostHandler(
  dependencies: ReauthPostDependencies
): (request: Request) => Promise<Response> {
  return async request => {
    try {
      return await withSigaaReauthOwner(
        request,
        (authenticatedRequest, owner) =>
          handleReauthRequest(authenticatedRequest, owner, dependencies),
        dependencies.authenticateRequest
      );
    } catch {
      return privateSigaaResponse(
        ApiError.serviceUnavailable(
          "A reautenticação SIGAA está temporariamente indisponível.",
          ErrorCode.SIGAA_REAUTH_UNAVAILABLE
        )
      );
    }
  };
}

async function handleReauthRequest(
  authenticatedRequest: Request,
  owner: SigaaReauthOwner,
  dependencies: ReauthPostDependencies
): Promise<Response> {
  let body: unknown;

  try {
    body = await authenticatedRequest.json();
  } catch {
    return ApiError.validation("Corpo da requisição deve ser JSON válido");
  }

  const parsed = sigaaReauthRequestSchema.safeParse(body);

  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const result = await reauthenticateForSigaa(
    { owner, password: parsed.data.password, proposalId: parsed.data.proposalId },
    {
      limiter: dependencies.limiter,
      proofIssuer: {
        issueProof: (usuarioId, proposalId) =>
          proposalId
            ? dependencies.getProofService().issueProof(usuarioId, proposalId)
            : dependencies.getProofService().issueProof(usuarioId),
      },
      comparePassword: dependencies.comparePassword,
    }
  );

  if (result.kind === "rate_limited") {
    const response = ApiError.rateLimited(
      "Muitas tentativas de reautenticação. Tente novamente mais tarde.",
      ErrorCode.SIGAA_REAUTH_RATE_LIMITED
    );
    response.headers.set("Retry-After", result.retryAfter);
    return response;
  }

  if (result.kind === "password_invalid") {
    return ApiError.forbidden("Senha do Aquário incorreta.", ErrorCode.SIGAA_REAUTH_FAILED);
  }

  return NextResponse.json(result.proof);
}
