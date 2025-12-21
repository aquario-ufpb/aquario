import { NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";

export async function GET() {
  const { centrosRepository } = getContainer();
  const centros = await centrosRepository.findMany();

  return NextResponse.json(centros);
}
