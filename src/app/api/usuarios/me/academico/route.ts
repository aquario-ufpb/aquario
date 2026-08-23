import { getContainer } from "@/lib/server/container";
import { ApiError } from "@/lib/server/errors";
import { importedStateResponse } from "@/lib/server/services/sigaa/http-responses";
import { privateSigaaResponse, withSigaaOwner } from "@/lib/server/services/sigaa/reauth";
import { usuarioIdSchema } from "@/lib/server/services/sigaa/storage.types";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    return await withSigaaOwner(request, async (_authenticatedRequest, owner) => {
      const state = await getContainer().sigaaRepository.readImportedState(
        usuarioIdSchema.parse(owner.usuarioId)
      );
      return importedStateResponse(state);
    });
  } catch {
    return privateSigaaResponse(
      ApiError.internal("Não foi possível carregar os dados acadêmicos.")
    );
  }
}
