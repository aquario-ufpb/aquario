import { z } from "zod";
import { withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { privatePlanResponse, readPlanRequest } from "@/lib/server/services/planner/private-plans";

type Context = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";
export function GET(request: Request, context: Context) {
  return withAuth(request, async (_req, owner) => {
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) {
      return privatePlanResponse({ message: "Cenário inválido." }, 400);
    }
    try {
      const plan = await getContainer().enrollmentPlanRepository.find(owner.id, id);
      return plan
        ? privatePlanResponse(plan)
        : privatePlanResponse({ message: "Cenário não encontrado." }, 404);
    } catch {
      return privatePlanResponse({ message: "Não foi possível carregar o cenário." }, 503);
    }
  });
}
export function PATCH(request: Request, context: Context) {
  return withAuth(request, async (req, owner) => {
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) {
      return privatePlanResponse({ message: "Cenário inválido." }, 400);
    }
    let body;
    try {
      body = await readPlanRequest(req);
      if (!body.expectedUpdatedAt) {
        throw new Error("version");
      }
    } catch {
      return privatePlanResponse({ message: "Cenário ou versão inválida." }, 400);
    }
    try {
      const plan = await getContainer().enrollmentPlanRepository.update(
        owner.id,
        id,
        body.expectedUpdatedAt as string,
        body.name,
        body.draft,
        owner.cursoId
      );
      return plan
        ? privatePlanResponse(plan)
        : privatePlanResponse(
            {
              message:
                "Cenário não encontrado ou alterado em outra aba. Recarregue antes de substituir.",
            },
            409
          );
    } catch {
      return privatePlanResponse({ message: "Não foi possível atualizar." }, 503);
    }
  });
}
export function DELETE(request: Request, context: Context) {
  return withAuth(request, async (_req, owner) => {
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) {
      return privatePlanResponse({ message: "Cenário inválido." }, 400);
    }
    try {
      const deleted = await getContainer().enrollmentPlanRepository.delete(owner.id, id);
      return privatePlanResponse(
        deleted ? { deleted: true } : { message: "Cenário não encontrado." },
        deleted ? 200 : 404
      );
    } catch {
      return privatePlanResponse({ message: "Não foi possível excluir." }, 503);
    }
  });
}
