import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAdmin } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";

const mapUserToResponse = (u: {
  id: string;
  nome: string;
  email: string | null;
  papelPlataforma: string;
  eVerificado: boolean;
  eFacade: boolean;
  urlFotoPerfil: string | null;
  centro: { id: string; nome: string; sigla: string };
  curso: { id: string; nome: string };
  permissoes: string[];
}) => ({
  id: u.id,
  nome: u.nome,
  email: u.email,
  papelPlataforma: u.papelPlataforma,
  eVerificado: u.eVerificado,
  eFacade: u.eFacade,
  urlFotoPerfil: u.urlFotoPerfil,
  centro: {
    id: u.centro.id,
    nome: u.centro.nome,
    sigla: u.centro.sigla,
  },
  curso: {
    id: u.curso.id,
    nome: u.curso.nome,
  },
  permissoes: u.permissoes,
});

export function GET(request: Request) {
  return withAdmin(request, async req => {
    const { usuariosRepository } = getContainer();
    const { searchParams } = new URL(req.url);

    // Check if this is a search request
    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      const limit = parseInt(searchParams.get("limit") || "10", 10);
      const usuarios = await usuariosRepository.search({
        query: searchQuery,
        limit: Math.min(limit, 100), // Cap at 100 for safety
      });

      return NextResponse.json(usuarios.map(mapUserToResponse));
    }

    // Check if this is a paginated request
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");

    if (page || limit) {
      const pageNum = parseInt(page || "1", 10);
      const limitNum = parseInt(limit || "25", 10);
      const { users, total } = await usuariosRepository.findManyPaginated({
        page: pageNum,
        limit: Math.min(limitNum, 100), // Cap at 100 for safety
      });

      return NextResponse.json({
        users: users.map(mapUserToResponse),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

    // Default: return all users (for backward compatibility)
    const usuarios = await usuariosRepository.findMany();
    return NextResponse.json(usuarios.map(mapUserToResponse));
  });
}
