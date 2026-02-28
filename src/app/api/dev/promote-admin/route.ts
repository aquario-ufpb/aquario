import { NextResponse } from "next/server";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { handleError } from "@/lib/server/errors";
import { IS_DEV } from "@/lib/shared/config/env";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
  if (!IS_DEV) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return withAuth(request, async (req, usuario) => {
    try {
      const body = await req.json().catch(() => ({}));
      const role = body.role === "USER" ? "USER" : "MASTER_ADMIN";
      const { usuariosRepository } = getContainer();
      await usuariosRepository.updatePapelPlataforma(usuario.id, role);
      return NextResponse.json({ papelPlataforma: role });
    } catch (error) {
      return handleError(error, "Erro ao alterar papel");
    }
  });
}
