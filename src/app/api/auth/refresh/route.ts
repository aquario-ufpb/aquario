import { NextResponse } from "next/server";
import { signToken } from "@/lib/server/services/jwt/jwt";
import { withAuth } from "@/lib/server/services/auth/middleware";

export function POST(request: Request) {
  return withAuth(request, (_req, usuario) => {
    // Generate a new token
    const token = signToken(usuario.id);

    return Promise.resolve(NextResponse.json({ token }));
  });
}
