import { NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { entidadesRepository } = getContainer();
    const entidades = await entidadesRepository.findMany();

    return NextResponse.json(entidades);
  } catch {
    return ApiError.internal("Erro ao buscar entidades");
  }
}
