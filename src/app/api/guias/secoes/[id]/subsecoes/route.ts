import { NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { subSecoesGuiaRepository } = getContainer();

  const subsecoes = await subSecoesGuiaRepository.findBySecaoId(id);

  return NextResponse.json(subsecoes);
}
