import { NextResponse } from "next/server";
import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";
import { withAdmin } from "@/lib/server/services/auth/middleware";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { campusRepository } = getContainer();
    const campusList = await campusRepository.findMany();
    return NextResponse.json(campusList);
  } catch {
    return ApiError.internal("Erro ao buscar campus");
  }
}

export function POST(request: Request) {
  return withAdmin(request, async req => {
    const body = await req.json();
    const { nome } = body;

    if (!nome?.trim()) {
      return ApiError.badRequest("Nome é obrigatório");
    }

    const { campusRepository } = getContainer();

    const existing = await campusRepository.findByNome(nome.trim());
    if (existing) {
      return ApiError.conflict("Já existe um campus com esse nome");
    }

    const campus = await campusRepository.create({ nome: nome.trim() });
    return NextResponse.json(campus, { status: 201 });
  });
}
