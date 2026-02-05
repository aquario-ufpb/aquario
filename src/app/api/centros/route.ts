import { NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { centrosRepository } = getContainer();
    const centros = await centrosRepository.findMany();

    return NextResponse.json(centros);
  } catch {
    return ApiError.internal("Erro ao buscar centros");
  }
}
