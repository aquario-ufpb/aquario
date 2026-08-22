import { NextResponse } from "next/server";

import type {
  DeleteImportedDataResult,
  DisconnectResult,
  ImportedAcademicState,
  SigaaRunReceipt,
  SigaaSyncFailureCode,
} from "@/lib/server/db/interfaces/sigaa-repository.interface";
import { ApiError } from "@/lib/server/errors";
import { ErrorCode } from "@/lib/shared/errors";

import type { SynchronizeOwnAcademicDataResult } from "./synchronize-own-academic-data";
import type { ConfirmOwnCourseChangeResult } from "./confirm-own-course-change";

export function importedStateResponse(state: ImportedAcademicState): Response {
  return NextResponse.json(state);
}

export function synchronizationResponse(result: SynchronizeOwnAcademicDataResult): Response {
  switch (result.kind) {
    case "synchronized":
      return NextResponse.json({
        status: "synchronized",
        run: serializeRun(result.run),
        synchronizedAt: result.synchronizedAt.toISOString(),
      });
    case "replay":
      return NextResponse.json({ status: "replay", run: serializeRun(result.run) });
    case "busy":
      return withRetryAfter(
        ApiError.conflict(
          "Já existe uma sincronização SIGAA em andamento.",
          ErrorCode.SIGAA_SYNC_BUSY
        ),
        result.retryAt
      );
    case "rate_limited":
      return withRetryAfter(
        ApiError.rateLimited(
          "Limite de sincronizações SIGAA atingido. Tente novamente mais tarde.",
          ErrorCode.SIGAA_SYNC_RATE_LIMITED
        ),
        result.retryAt
      );
    case "rejected":
      return rejectedResponse(result.failure);
    case "course_resolution":
      return courseResolutionResponse(result.resolution);
    case "failed":
      return failureResponse(result.failure);
  }
}

export function courseChangeConfirmationResponse(result: ConfirmOwnCourseChangeResult): Response {
  switch (result.kind) {
    case "synchronized":
      return NextResponse.json({
        status: "synchronized",
        run: serializeRun(result.run),
        synchronizedAt: result.synchronizedAt.toISOString(),
        courseReplaced: true,
      });
    case "replay":
      return NextResponse.json({
        status: "replay",
        run: serializeRun(result.run),
        courseReplaced: result.courseReplaced,
      });
    case "busy":
      return withRetryAfter(
        ApiError.conflict(
          "Já existe uma sincronização SIGAA em andamento.",
          ErrorCode.SIGAA_SYNC_BUSY
        ),
        result.retryAt
      );
    case "rate_limited":
      return withRetryAfter(
        ApiError.rateLimited(
          "Limite de sincronizações SIGAA atingido. Tente novamente mais tarde.",
          ErrorCode.SIGAA_SYNC_RATE_LIMITED
        ),
        result.retryAt
      );
    case "blocked":
      return result.reason === "reauth_proposal_mismatch"
        ? ApiError.forbidden(
            "Reautentique-se especificamente para esta proposta de substituição.",
            ErrorCode.SIGAA_REAUTH_REQUIRED
          )
        : courseResolutionResponse({ kind: "stale" });
    case "stale":
      return courseResolutionResponse(result);
    case "rejected":
      return courseResolutionResponse(result.resolution);
    case "failed":
      return failureResponse(result.failure);
  }
}

export function disconnectResponse(result: DisconnectResult): Response {
  if (result.kind === "rate_limited") {
    return withRetryAfter(
      ApiError.rateLimited(
        "Limite de operações SIGAA atingido. Tente novamente mais tarde.",
        ErrorCode.SIGAA_OPERATION_RATE_LIMITED
      ),
      result.retryAt
    );
  }
  return NextResponse.json({
    status: "disconnected",
    disconnectedAt: result.disconnectedAt.toISOString(),
  });
}

export function deleteImportedDataResponse(result: DeleteImportedDataResult): Response {
  if (result.kind === "rate_limited") {
    return withRetryAfter(
      ApiError.rateLimited(
        "Limite de operações SIGAA atingido. Tente novamente mais tarde.",
        ErrorCode.SIGAA_OPERATION_RATE_LIMITED
      ),
      result.retryAt
    );
  }
  return NextResponse.json({
    status: "deleted",
    hadImportedData: result.hadImportedData,
    matriculaCleared: result.matriculaCleared,
  });
}

function rejectedResponse(
  failure: Extract<SynchronizeOwnAcademicDataResult, { kind: "rejected" }>["failure"]
): Response {
  switch (failure) {
    case "COURSE_MISMATCH":
      return ApiError.conflict(
        "O curso informado pelo SIGAA não corresponde ao perfil.",
        ErrorCode.SIGAA_COURSE_MISMATCH
      );
    case "SIGAA_IDENTITY_MISMATCH":
      return ApiError.conflict(
        "A conta SIGAA não corresponde ao perfil.",
        ErrorCode.SIGAA_IDENTITY_MISMATCH
      );
    case "LEASE_LOST":
      return ApiError.conflict(
        "A sincronização foi substituída por uma tentativa mais recente.",
        ErrorCode.SIGAA_LEASE_LOST
      );
  }
}

function courseResolutionResponse(
  resolution: import("@/lib/server/db/interfaces/sigaa-repository.interface").SigaaCourseResolution
): Response {
  if (resolution.kind === "confirmation_required") {
    const proposal = resolution.proposal;
    return NextResponse.json(
      {
        message: "O SIGAA informou um curso diferente do perfil.",
        code: ErrorCode.SIGAA_COURSE_MISMATCH,
        resolution: "confirmation_required",
        proposalId: proposal.proposalId,
        expiresAt: proposal.expiresAt.toISOString(),
        currentCourse: proposal.currentCourse,
        sigaaCourse: proposal.sigaaCourse,
        targetCourse: proposal.targetCourse,
        ...(proposal.currentCenter ? { currentCenter: proposal.currentCenter } : {}),
        ...(proposal.targetCenter ? { targetCenter: proposal.targetCenter } : {}),
      },
      { status: 409 }
    );
  }
  if (resolution.kind === "blocked") {
    return NextResponse.json(
      {
        message: "O curso informado pelo SIGAA não pôde ser confirmado no catálogo.",
        code: ErrorCode.SIGAA_COURSE_MISMATCH,
        resolution: "blocked",
        reason: resolution.reason,
      },
      { status: 409 }
    );
  }
  return NextResponse.json(
    {
      message: "A proposta de substituição de curso não é mais válida.",
      code: ErrorCode.SIGAA_COURSE_MISMATCH,
      resolution: "stale",
    },
    { status: 409 }
  );
}

function failureResponse(failure: SigaaSyncFailureCode): Response {
  switch (failure) {
    case "SIGAA_AUTH_FAILED":
      return ApiError.unauthorized(
        "Usuário ou senha do SIGAA incorretos.",
        ErrorCode.SIGAA_AUTH_FAILED
      );
    case "SIGAA_IDENTITY_INVALID":
      return ApiError.serviceUnavailable(
        "O SIGAA retornou uma identidade inválida.",
        ErrorCode.SIGAA_IDENTITY_INVALID
      );
    case "SIGAA_IDENTITY_MISMATCH":
      return ApiError.conflict(
        "A conta SIGAA não corresponde ao perfil.",
        ErrorCode.SIGAA_IDENTITY_MISMATCH
      );
    case "SIGAA_TIMEOUT":
      return jsonError(504, "O SIGAA demorou demais para responder.", ErrorCode.SIGAA_TIMEOUT);
    case "SIGAA_UNAVAILABLE":
      return ApiError.serviceUnavailable(
        "O SIGAA está temporariamente indisponível.",
        ErrorCode.SIGAA_UNAVAILABLE
      );
    case "SIGAA_RESPONSE_INVALID":
      return jsonError(
        502,
        "O SIGAA retornou uma resposta incompatível.",
        ErrorCode.SIGAA_RESPONSE_INVALID
      );
    case "CONNECTOR_UNAVAILABLE":
      return ApiError.serviceUnavailable(
        "O conector SIGAA está temporariamente indisponível.",
        ErrorCode.SIGAA_CONNECTOR_UNAVAILABLE
      );
    case "CONNECTOR_MISCONFIGURED":
      return ApiError.serviceUnavailable(
        "O conector SIGAA não está configurado corretamente.",
        ErrorCode.SIGAA_CONNECTOR_MISCONFIGURED
      );
    case "COURSE_MISMATCH":
      return rejectedResponse("COURSE_MISMATCH");
    case "LEASE_LOST":
      return rejectedResponse("LEASE_LOST");
    case "INTERNAL_ERROR":
      return ApiError.internal("Não foi possível concluir a sincronização SIGAA.");
  }
}

function serializeRun(run: SigaaRunReceipt) {
  return {
    id: run.id,
    status: run.status,
    failureCode: run.failureCode,
    connectorRequestId: run.connectorRequestId,
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
  };
}

function jsonError(status: number, message: string, code: string): Response {
  return NextResponse.json({ message, code }, { status });
}

function withRetryAfter(response: Response, retryAt: Date): Response {
  response.headers.set("Retry-After", retryAt.toUTCString());
  return response;
}
