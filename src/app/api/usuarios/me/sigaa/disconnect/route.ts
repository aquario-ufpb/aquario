import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";
import { disconnectResponse } from "@/lib/server/services/sigaa/http-responses";
import {
  createSigaaReauthProofServiceFromEnvironment,
  privateSigaaResponse,
  withRecentSigaaProof,
} from "@/lib/server/services/sigaa/reauth";
import { usuarioIdSchema } from "@/lib/server/services/sigaa/storage.types";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const proofService = createSigaaReauthProofServiceFromEnvironment();
    return await withRecentSigaaProof(
      request,
      proofService,
      async (_authenticatedRequest, owner) => {
        const result = await getContainer().sigaaRepository.disconnect(
          usuarioIdSchema.parse(owner.usuarioId)
        );
        return disconnectResponse(result);
      }
    );
  } catch {
    return privateSigaaResponse(ApiError.internal("Não foi possível desconectar a conta SIGAA."));
  }
}
