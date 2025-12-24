import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "@/lib/server/config/env";

export type JwtPayload = {
  sub: string; // User ID
  iat?: number; // Issued at
  exp?: number; // Expiration
};

const getSecret = (): string => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return JWT_SECRET;
};

/**
 * Sign a JWT token for a user
 */
export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, getSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT token
 * @returns The decoded payload or null if invalid
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const payload = jwt.verify(token, getSecret()) as JwtPayload;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Decode a JWT token without verifying (for debugging)
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = jwt.decode(token) as JwtPayload;
    return payload;
  } catch {
    return null;
  }
}
