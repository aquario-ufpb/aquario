import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAdmin, withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";

const mapUserToResponse = (u: {
  id: string;
  nome: string;
  email: string | null;
  slug: string | null;
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
  slug: u.slug,
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
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");
  const search = searchParams.get("search");

  // Standalone search (no pagination) only requires authentication
  if (search && !page) {
    return withAuth(request, async () => {
      const { usuariosRepository } = getContainer();
      const parsedLimit = parseInt(searchParams.get("limit") || "10", 10) || 10;
      const searchLimit = Math.min(Math.max(1, parsedLimit), 100);
      const usuarios = await usuariosRepository.search({
        query: search,
        limit: searchLimit,
      });

      return NextResponse.json(usuarios.map(mapUserToResponse));
    });
  }

  // Paginated listing and full dump require admin
  return withAdmin(request, async () => {
    const { usuariosRepository } = getContainer();
    const limit = searchParams.get("limit");
    const filter = searchParams.get("filter") as "all" | "facade" | "real" | null;

    if (page || limit) {
      const pageNum = Math.max(1, parseInt(page || "1", 10) || 1);
      const limitNum = Math.min(Math.max(1, parseInt(limit || "25", 10) || 25), 100);
      const validFilter = filter && ["all", "facade", "real"].includes(filter) ? filter : "all";
      const { users, total } = await usuariosRepository.findManyPaginated({
        page: pageNum,
        limit: limitNum,
        filter: validFilter,
        search: search || undefined,
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
