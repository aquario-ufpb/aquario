import { NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { cursosRepository } = getContainer();
  const cursos = await cursosRepository.findByCentroId(id);

  return NextResponse.json(cursos);
}
