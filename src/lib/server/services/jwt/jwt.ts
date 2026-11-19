import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { JWT_SECRET, JWT_EXPIRES_IN } from "@/lib/server/config/env";

const MAX_SESSION_SECONDS = 30 * 24 * 60 * 60;

const sessionClaims = z
  .object({
    sub: z.string().min(1),
    iat: z.number().int().positive(),
    exp: z.number().int().positive(),
    sessionVersion: z.number().int().nonnegative(),
    sessionStartedAt: z.number().int().positive(),
  })
  .strict();

export type Session = {
  sub: string;
  sessionVersion: number;
  sessionStartedAt: number;
};

const getSecret = (): string => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return JWT_SECRET;
};

export function signToken(
  userId: string,
  sessionVersion: number,
  sessionStartedAt = Math.floor(Date.now() / 1000)
): string {
  const options: SignOptions = {
    algorithm: "HS256",
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign({ sub: userId, sessionVersion, sessionStartedAt }, getSecret(), options);
}

export function verifyToken(token: string): Session | null {
  try {
    const claims = sessionClaims.parse(jwt.verify(token, getSecret(), { algorithms: ["HS256"] }));
    const { sessionStartedAt } = claims;
    const now = Math.floor(Date.now() / 1000);
    if (
      sessionStartedAt > claims.iat ||
      claims.iat > now ||
      now >= sessionStartedAt + MAX_SESSION_SECONDS
    ) {
      return null;
    }
    return { sub: claims.sub, sessionVersion: claims.sessionVersion, sessionStartedAt };
  } catch {
    return null;
  }
}
