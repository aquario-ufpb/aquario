import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getContainer } from "@/lib/server/container";
import { formatUserResponse } from "@/lib/server/utils/format-user-response";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const { usuariosRepository } = getContainer();

  const usuario = await usuariosRepository.findBySlug(slug);

  if (!usuario) {
    return NextResponse.json({ message: "Usuário não encontrado." }, { status: 404 });
  }

  return NextResponse.json(formatUserResponse(usuario));
}
