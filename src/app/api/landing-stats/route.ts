import { NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";

export const dynamic = "force-dynamic";

export async function GET() {
  const { usuariosRepository } = getContainer();

  const { total } = await usuariosRepository.findManyPaginated({
    page: 1,
    limit: 1,
    filter: "real",
  });

  return NextResponse.json({
    totalUsuarios: total,
    githubStars: 80,
  });
}
