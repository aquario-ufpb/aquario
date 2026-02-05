import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getContainer } from "@/lib/server/container";
import { formatUserResponse } from "@/lib/server/utils/format-user-response";
import { ApiError } from "@/lib/server/errors";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const { usuariosRepository } = getContainer();

    const usuario = await usuariosRepository.findBySlug(slug);

    if (!usuario) {
      return ApiError.userNotFound();
    }

    return NextResponse.json(formatUserResponse(usuario));
  } catch {
    return ApiError.internal("Erro ao buscar usuário");
  }
}
