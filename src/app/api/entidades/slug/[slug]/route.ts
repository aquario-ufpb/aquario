import { NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const { entidadesRepository } = getContainer();

  const entidade = await entidadesRepository.findBySlug(slug);

  if (!entidade) {
    return NextResponse.json({ message: "Entidade não encontrada." }, { status: 404 });
  }

  return NextResponse.json(entidade);
}
