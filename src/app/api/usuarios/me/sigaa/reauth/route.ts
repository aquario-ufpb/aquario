import {
  createSigaaReauthPostHandler,
  createSigaaReauthProofServiceFromEnvironment,
  type ISigaaReauthAttemptLimiter,
} from "@/lib/server/services/sigaa/reauth";
import { getContainer } from "@/lib/server/container";
import { usuarioIdSchema } from "@/lib/server/services/sigaa/storage.types";

export const dynamic = "force-dynamic";

const databaseLimiter: ISigaaReauthAttemptLimiter = {
  async consumeReauthAttempt({ usuarioId }) {
    const decision = await getContainer().sigaaRepository.consumeRateLimit({
      ownerId: usuarioIdSchema.parse(usuarioId),
      operation: "REAUTH",
    });

    if (decision.kind === "allowed") {
      return { kind: "allowed" };
    }

    return {
      kind: "limited",
      retryAfter: decision.retryAt.toUTCString(),
    };
  },
};

const post = createSigaaReauthPostHandler({
  limiter: databaseLimiter,
  getProofService: createSigaaReauthProofServiceFromEnvironment,
});

export function POST(request: Request): Promise<Response> {
  return post(request);
}
