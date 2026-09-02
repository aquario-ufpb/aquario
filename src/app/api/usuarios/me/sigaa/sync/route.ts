import { getContainer } from "@/lib/server/container";
import { sigaaSyncRequestSchema } from "@/lib/server/api-schemas/sigaa";
import { ApiError, fromZodError } from "@/lib/server/errors";
import { createSigaaConnectorFromEnvironment } from "@/lib/server/services/sigaa/create-connector";
import { synchronizationResponse } from "@/lib/server/services/sigaa/http-responses";
import {
  createSigaaReauthProofServiceFromEnvironment,
  privateSigaaResponse,
  withRecentSigaaProof,
} from "@/lib/server/services/sigaa/reauth";
import { synchronizeOwnAcademicData } from "@/lib/server/services/sigaa/synchronize-own-academic-data";
import { ErrorCode } from "@/lib/shared/errors";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function POST(request: Request): Promise<Response> {
  try {
    const proofService = createSigaaReauthProofServiceFromEnvironment();
    return await withRecentSigaaProof(request, proofService, handleSync);
  } catch {
    return privateSigaaResponse(
      ApiError.serviceUnavailable(
        "A sincronização SIGAA está temporariamente indisponível.",
        ErrorCode.SIGAA_CONNECTOR_UNAVAILABLE
      )
    );
  }
}

async function handleSync(
  request: Request,
  owner: Readonly<{ usuarioId: string }>
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiError.validation("Corpo da requisição deve ser JSON válido");
  }

  const parsed = sigaaSyncRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const result = await synchronizeOwnAcademicData(
    { ownerId: owner.usuarioId, ...parsed.data },
    {
      repository: getContainer().sigaaRepository,
      connector: createSigaaConnectorFromEnvironment(),
    }
  );
  return synchronizationResponse(result);
}
