import { NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";

export const dynamic = "force-dynamic";

export async function GET() {
  const { entidadesRepository } = getContainer();
  const entidades = await entidadesRepository.findMany();

  return NextResponse.json(entidades);
}
