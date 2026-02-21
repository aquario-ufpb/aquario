import { NextResponse } from "next/server";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { handleError } from "@/lib/server/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const stepStateSchema = z
  .object({
    completedAt: z.string().optional(),
    skippedAt: z.string().optional(),
  })
  .strict();

const patchSchema = z
  .object({
    welcome: z.object({ completedAt: z.string() }).strict().optional(),
    periodo: stepStateSchema.optional(),
    concluidas: stepStateSchema.optional(),
    entidades: stepStateSchema.optional(),
    done: z.object({ completedAt: z.string() }).strict().optional(),
    semesters: z
      .record(
        z.string(),
        z
          .object({
            cursando: stepStateSchema.optional(),
            turmas: stepStateSchema.optional(),
          })
          .strict()
      )
      .optional(),
  })
  .strict();

export function GET(request: Request) {
  return withAuth(request, async (_req, usuario) => {
    try {
      const { usuariosRepository } = getContainer();
      const metadata = await usuariosRepository.getOnboardingMetadata(usuario.id);
      return NextResponse.json(metadata ?? {});
    } catch (error) {
      return handleError(error, "Erro ao buscar onboarding metadata");
    }
  });
}

export function PATCH(request: Request) {
  return withAuth(request, async (req, usuario) => {
    try {
      const body = await req.json();
      const parsed = patchSchema.parse(body);
      const { usuariosRepository } = getContainer();
      await usuariosRepository.updateOnboardingMetadata(usuario.id, parsed);
      const updated = await usuariosRepository.getOnboardingMetadata(usuario.id);
      return NextResponse.json(updated ?? {});
    } catch (error) {
      return handleError(error, "Erro ao atualizar onboarding metadata");
    }
  });
}

export function DELETE(request: Request) {
  return withAuth(request, async (_req, usuario) => {
    try {
      const { usuariosRepository } = getContainer();
      await usuariosRepository.clearOnboardingMetadata(usuario.id);
      return NextResponse.json({});
    } catch (error) {
      return handleError(error, "Erro ao limpar onboarding metadata");
    }
  });
}
