import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { getContainer } from "@/lib/server/container";
import { withAuth } from "@/lib/server/services/auth/middleware";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateEntidadeSchema = z.object({
  nome: z.string().optional(),
  subtitle: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
  tipo: z
    .enum([
      "LABORATORIO",
      "GRUPO",
      "LIGA_ACADEMICA",
      "EMPRESA",
      "ATLETICA",
      "CENTRO_ACADEMICO",
      "OUTRO",
    ])
    .optional(),
  urlFoto: z.string().nullable().optional(),
  contato: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  foundingDate: z.string().nullable().optional(),
  slug: z.string().optional(),
});

export function PUT(request: Request, context: RouteContext) {
  return withAuth(request, async (req, usuario) => {
    const { id } = await context.params;

    try {
      const body = await req.json();
      const data = updateEntidadeSchema.parse(body);

      const { entidadesRepository } = getContainer();

      const entidade = await entidadesRepository.findById(id);
      if (!entidade) {
        return NextResponse.json({ message: "Entidade não encontrada." }, { status: 404 });
      }

      // Check if user has permission to edit (admin or member of entidade)
      const isAdmin = usuario.papelPlataforma === "MASTER_ADMIN";
      const isMember = entidade.membros?.some(
        m => m.usuario.id === usuario.id && m.papel === "ADMIN"
      );

      if (!isAdmin && !isMember) {
        return NextResponse.json(
          { message: "Você não tem permissão para editar esta entidade." },
          { status: 403 }
        );
      }

      // Build update data
      const updateData: Record<string, unknown> = {};
      if (data.nome !== undefined) {
        updateData.nome = data.nome;
      }
      if (data.subtitle !== undefined) {
        updateData.subtitle = data.subtitle;
      }
      if (data.descricao !== undefined) {
        updateData.descricao = data.descricao;
      }
      if (data.tipo !== undefined) {
        updateData.tipo = data.tipo;
      }
      if (data.urlFoto !== undefined) {
        updateData.urlFoto = data.urlFoto;
      }
      if (data.contato !== undefined) {
        updateData.contato = data.contato;
      }
      if (data.instagram !== undefined) {
        updateData.instagram = data.instagram;
      }
      if (data.linkedin !== undefined) {
        updateData.linkedin = data.linkedin;
      }
      if (data.website !== undefined) {
        updateData.website = data.website;
      }
      if (data.location !== undefined) {
        updateData.location = data.location;
      }
      if (data.foundingDate !== undefined) {
        updateData.foundingDate = data.foundingDate ? new Date(data.foundingDate) : null;
      }
      if (data.slug !== undefined) {
        // Store slug in metadata
        const currentMetadata = (entidade.metadata as Record<string, unknown>) || {};
        updateData.metadata = { ...currentMetadata, slug: data.slug };
      }

      await entidadesRepository.update(id, updateData);

      return NextResponse.json({ message: "Entidade atualizada com sucesso." });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { message: error.errors[0]?.message || "Dados inválidos" },
          { status: 400 }
        );
      }

      const message = error instanceof Error ? error.message : "Erro ao atualizar entidade";
      return NextResponse.json({ message }, { status: 400 });
    }
  });
}
