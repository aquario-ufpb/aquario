import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { prisma } from "@/lib/server/db/prisma";

export function GET(request: Request) {
  return withAuth(request, async (_req, usuario) => {
    // Get all memberships for the current user
    const memberships = await prisma.membroEntidade.findMany({
      where: {
        usuarioId: usuario.id,
      },
      include: {
        entidade: {
          include: {
            centro: true,
          },
        },
        cargo: true,
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    // Format the response
    const formattedMemberships = memberships.map(m => ({
      id: m.id,
      entidade: {
        id: m.entidade.id,
        nome: m.entidade.nome,
        slug: m.entidade.slug,
        tipo: m.entidade.tipo,
        urlFoto: m.entidade.urlFoto,
        centro: {
          id: m.entidade.centro.id,
          nome: m.entidade.centro.nome,
          sigla: m.entidade.centro.sigla,
        },
      },
      papel: m.papel,
      cargo: m.cargo
        ? {
            id: m.cargo.id,
            nome: m.cargo.nome,
            descricao: m.cargo.descricao,
            ordem: m.cargo.ordem,
          }
        : null,
      startedAt: m.startedAt.toISOString(),
      endedAt: m.endedAt?.toISOString() || null,
    }));

    return NextResponse.json(formattedMemberships);
  });
}
