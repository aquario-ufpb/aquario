import { withAuth } from "@/lib/server/services/auth/middleware";
import { getContainer } from "@/lib/server/container";
import { privatePlanResponse, readPlanRequest } from "@/lib/server/services/planner/private-plans";

export const dynamic = "force-dynamic";
export function GET(request: Request) {
  return withAuth(request, async (_req, owner) => {
    try {
      return privatePlanResponse(await getContainer().enrollmentPlanRepository.list(owner.id));
    } catch {
      return privatePlanResponse({ message: "Não foi possível carregar seus cenários." }, 503);
    }
  });
}
export function POST(request: Request) {
  return withAuth(request, async (req, owner) => {
    let body;
    try {
      body = await readPlanRequest(req);
    } catch {
      return privatePlanResponse({ message: "Cenário inválido ou muito grande." }, 400);
    }
    try {
      return privatePlanResponse(
        await getContainer().enrollmentPlanRepository.create(
          owner.id,
          owner.cursoId,
          body.name,
          body.draft
        ),
        201
      );
    } catch (error) {
      return privatePlanResponse(
        {
          message:
            error instanceof Error && error.message === "PLAN_QUOTA"
              ? "Limite de 30 cenários. Exclua um antes de salvar outro."
              : "Não foi possível salvar. Confira se a migração do planejador foi aplicada.",
        },
        503
      );
    }
  });
}
