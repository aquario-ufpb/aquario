import { sigaaCourseChangeConfirmationRequestSchema } from "@/lib/server/api-schemas/sigaa";
import { getContainer } from "@/lib/server/container";
import { ApiError, fromZodError } from "@/lib/server/errors";
import { confirmOwnCourseChange } from "@/lib/server/services/sigaa/confirm-own-course-change";
import { createSigaaConnectorFromEnvironment } from "@/lib/server/services/sigaa/create-connector";
import { courseChangeConfirmationResponse } from "@/lib/server/services/sigaa/http-responses";
import {
  createSigaaReauthProofServiceFromEnvironment,
  privateSigaaResponse,
  type RecentlyReauthenticatedSigaaOwner,
  withRecentSigaaProof,
} from "@/lib/server/services/sigaa/reauth";
import { ErrorCode } from "@/lib/shared/errors";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function POST(request: Request): Promise<Response> {
  try {
    return await withRecentSigaaProof(
      request,
      createSigaaReauthProofServiceFromEnvironment(),
      handleConfirmation
    );
  } catch {
    return privateSigaaResponse(
      ApiError.serviceUnavailable(
        "A confirmação da substituição de curso está temporariamente indisponível.",
        ErrorCode.SIGAA_CONNECTOR_UNAVAILABLE
      )
    );
  }
}

async function handleConfirmation(
  request: Request,
  owner: RecentlyReauthenticatedSigaaOwner
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiError.validation("Corpo da requisição deve ser JSON válido");
  }

  const parsed = sigaaCourseChangeConfirmationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const result = await confirmOwnCourseChange(
    { ownerId: owner.usuarioId, proofProposalId: owner.proposalId, ...parsed.data },
    {
      repository: getContainer().sigaaRepository,
      connector: createSigaaConnectorFromEnvironment(),
    }
  );
  return courseChangeConfirmationResponse(result);
}
