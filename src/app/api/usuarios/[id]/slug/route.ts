import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { withAdmin } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateSlugSchema = z.object({
  slug: z.string().nullable(),
});

export function PATCH(request: Request, context: RouteContext) {
  return withAdmin(request, async req => {
    try {
      const { id } = await context.params;
      const body = await req.json();
      const data = updateSlugSchema.parse(body);

      const { usuariosRepository } = getContainer();

      // Normalize slug: empty string becomes null, trim whitespace, lowercase
      const normalizedSlug = data.slug?.trim().toLowerCase() || null;

      await usuariosRepository.updateSlug(id, normalizedSlug);

      // Fetch updated user
      const updatedUser = await usuariosRepository.findById(id);
      return NextResponse.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { message: error.errors[0]?.message || "Dados inválidos" },
          { status: 400 }
        );
      }

      const message = error instanceof Error ? error.message : "Erro ao atualizar slug";
      return NextResponse.json({ message }, { status: 400 });
    }
  });
}
