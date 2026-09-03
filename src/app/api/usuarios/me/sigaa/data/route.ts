import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";
import { deleteImportedDataResponse } from "@/lib/server/services/sigaa/http-responses";
import {
  createSigaaReauthProofServiceFromEnvironment,
  privateSigaaResponse,
  withRecentSigaaProof,
} from "@/lib/server/services/sigaa/reauth";
import { usuarioIdSchema } from "@/lib/server/services/sigaa/storage.types";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request): Promise<Response> {
  try {
    const proofService = createSigaaReauthProofServiceFromEnvironment();
    return await withRecentSigaaProof(
      request,
      proofService,
      async (_authenticatedRequest, owner) => {
        const result = await getContainer().sigaaRepository.deleteImportedData(
          usuarioIdSchema.parse(owner.usuarioId)
        );
        return deleteImportedDataResponse(result);
      }
    );
  } catch {
    return privateSigaaResponse(
      ApiError.internal("Não foi possível excluir os dados importados do SIGAA.")
    );
  }
}
