import { NextResponse } from "next/server";
import { PrismaDisciplinaRepository } from "@/lib/server/db/implementations/prisma/prisma-disciplina-repository";

export async function GET(_request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  try {
    const { codigo } = await params;

    const repo = new PrismaDisciplinaRepository();
    const relacoes = await repo.getRelacoes(codigo);

    return NextResponse.json(relacoes);
  } catch (error) {
    console.error("Erro ao buscar relações:", error);
    return NextResponse.json({ error: "Erro ao buscar relações" }, { status: 500 });
  }
}
