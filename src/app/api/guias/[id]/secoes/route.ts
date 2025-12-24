import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getContainer } from "@/lib/server/container";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { secoesGuiaRepository } = getContainer();

  const secoes = await secoesGuiaRepository.findByGuiaId(id);

  return NextResponse.json(secoes);
}
