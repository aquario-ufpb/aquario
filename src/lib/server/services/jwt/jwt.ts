import jwt from "jsonwebtoken";

export type JwtPayload = {
  sub: string; // User ID
  iat?: number; // Issued at
  exp?: number; // Expiration
};

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
};

const getExpiresIn = (): string => {
  return process.env.JWT_EXPIRES_IN || "7d";
};

/**
 * Sign a JWT token for a user
 */
export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, getSecret(), {
    expiresIn: getExpiresIn(),
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

