-- CreateEnum
CREATE TYPE "MatriculaOrigem" AS ENUM ('LEGACY', 'MANUAL', 'SIGAA');

-- CreateEnum
CREATE TYPE "SigaaConnectionStatus" AS ENUM ('PENDING', 'CONNECTED', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "SigaaSyncRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "SigaaSyncFailureCode" AS ENUM (
    'SIGAA_AUTH_FAILED',
    'SIGAA_IDENTITY_INVALID',
    'SIGAA_IDENTITY_MISMATCH',
    'SIGAA_TIMEOUT',
    'SIGAA_UNAVAILABLE',
    'SIGAA_RESPONSE_INVALID',
    'CONNECTOR_UNAVAILABLE',
    'CONNECTOR_MISCONFIGURED',
    'COURSE_MISMATCH',
    'LEASE_LOST',
    'INTERNAL_ERROR'
);

-- CreateEnum
CREATE TYPE "SigaaRateLimitOperation" AS ENUM ('REAUTH', 'SYNC', 'DISCONNECT', 'DELETE_IMPORTED_DATA');

-- AlterTable
ALTER TABLE "Usuario"
ADD COLUMN "matriculaOrigem" "MatriculaOrigem",
ADD COLUMN "matriculaVerificadaPeloSigaaEm" TIMESTAMP(3);

UPDATE "Usuario"
SET "matriculaOrigem" = 'LEGACY'
WHERE "matricula" IS NOT NULL;

ALTER TABLE "Usuario"
ADD CONSTRAINT "Usuario_matricula_provenance_check"
CHECK (
    ("matricula" IS NULL AND "matriculaOrigem" IS NULL AND "matriculaVerificadaPeloSigaaEm" IS NULL)
    OR ("matricula" IS NOT NULL AND "matriculaOrigem" IS NOT NULL)
);

-- CreateTable
CREATE TABLE "SigaaConnection" (
    "usuarioId" TEXT NOT NULL,
    "status" "SigaaConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "consentVersion" VARCHAR(64),
    "consentedAt" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3),
    "disconnectedAt" TIMESTAMP(3),
    "leaseGeneration" BIGINT NOT NULL DEFAULT 0,
    "leaseRunId" TEXT,
    "leaseTokenDigest" CHAR(64),
    "leaseExpiresAt" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SigaaConnection_pkey" PRIMARY KEY ("usuarioId"),
    CONSTRAINT "SigaaConnection_consent_check" CHECK (
        ("consentVersion" IS NULL AND "consentedAt" IS NULL)
        OR ("consentVersion" IS NOT NULL AND "consentedAt" IS NOT NULL)
    ),
    CONSTRAINT "SigaaConnection_lease_check" CHECK (
        ("leaseRunId" IS NULL AND "leaseTokenDigest" IS NULL AND "leaseExpiresAt" IS NULL)
        OR ("leaseRunId" IS NOT NULL AND "leaseTokenDigest" IS NOT NULL AND "leaseExpiresAt" IS NOT NULL)
    ),
    CONSTRAINT "SigaaConnection_lease_digest_check" CHECK (
        "leaseTokenDigest" IS NULL OR "leaseTokenDigest" ~ '^[0-9a-f]{64}$'
    ),
    CONSTRAINT "SigaaConnection_generation_check" CHECK ("leaseGeneration" >= 0)
);

-- CreateTable
CREATE TABLE "SigaaSyncRun" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "idempotencyKey" VARCHAR(64) NOT NULL,
    "status" "SigaaSyncRunStatus" NOT NULL DEFAULT 'RUNNING',
    "leaseGeneration" BIGINT NOT NULL,
    "leaseExpiresAt" TIMESTAMP(3) NOT NULL,
    "courseIdentityToken" CHAR(64) NOT NULL,
    "consentVersion" VARCHAR(64) NOT NULL,
    "failureCode" "SigaaSyncFailureCode",
    "connectorRequestId" VARCHAR(64),
    "contractVersion" VARCHAR(16),
    "upstreamCommit" CHAR(40),
    "componentCount" INTEGER,
    "gradeCount" INTEGER,
    "classCount" INTEGER,
    "iniciadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadoEm" TIMESTAMP(3),
    "retentionExpiresAt" TIMESTAMP(3),

    CONSTRAINT "SigaaSyncRun_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SigaaSyncRun_idempotency_key_check" CHECK (char_length("idempotencyKey") > 0),
    CONSTRAINT "SigaaSyncRun_generation_check" CHECK ("leaseGeneration" > 0),
    CONSTRAINT "SigaaSyncRun_course_token_check" CHECK ("courseIdentityToken" ~ '^[0-9a-f]{64}$'),
    CONSTRAINT "SigaaSyncRun_upstream_commit_check" CHECK (
        "upstreamCommit" IS NULL OR "upstreamCommit" ~ '^[0-9a-f]{40}$'
    ),
    CONSTRAINT "SigaaSyncRun_counts_check" CHECK (
        ("componentCount" IS NULL OR "componentCount" >= 0)
        AND ("gradeCount" IS NULL OR "gradeCount" >= 0)
        AND ("classCount" IS NULL OR "classCount" >= 0)
    ),
    CONSTRAINT "SigaaSyncRun_lifecycle_check" CHECK (
        ("status" = 'RUNNING' AND "failureCode" IS NULL AND "finalizadoEm" IS NULL AND "retentionExpiresAt" IS NULL)
        OR ("status" = 'SUCCEEDED' AND "failureCode" IS NULL AND "finalizadoEm" IS NOT NULL AND "retentionExpiresAt" IS NOT NULL)
        OR ("status" IN ('FAILED', 'SUPERSEDED') AND "failureCode" IS NOT NULL AND "finalizadoEm" IS NOT NULL AND "retentionExpiresAt" IS NOT NULL)
    )
);

-- CreateTable
CREATE TABLE "SigaaAcademicSnapshot" (
    "usuarioId" TEXT NOT NULL,
    "contractVersion" VARCHAR(16) NOT NULL,
    "connectorObservedAt" TIMESTAMP(3) NOT NULL,
    "synchronizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "upstreamCommit" CHAR(40) NOT NULL,
    "installedByRunId" TEXT,
    "payload" JSONB NOT NULL,

    CONSTRAINT "SigaaAcademicSnapshot_pkey" PRIMARY KEY ("usuarioId"),
    CONSTRAINT "SigaaAcademicSnapshot_upstream_commit_check" CHECK ("upstreamCommit" ~ '^[0-9a-f]{40}$'),
    CONSTRAINT "SigaaAcademicSnapshot_payload_check" CHECK (jsonb_typeof("payload") = 'object')
);

-- CreateTable
CREATE TABLE "SigaaRateLimitBucket" (
    "usuarioId" TEXT NOT NULL,
    "operation" "SigaaRateLimitOperation" NOT NULL,
    "count" INTEGER NOT NULL,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SigaaRateLimitBucket_pkey" PRIMARY KEY ("usuarioId", "operation"),
    CONSTRAINT "SigaaRateLimitBucket_window_check" CHECK ("count" > 0 AND "resetAt" > "windowStartedAt")
);

-- CreateIndex
CREATE UNIQUE INDEX "SigaaConnection_usuarioId_leaseRunId_key" ON "SigaaConnection"("usuarioId", "leaseRunId");

-- CreateIndex
CREATE UNIQUE INDEX "SigaaAcademicSnapshot_usuarioId_installedByRunId_key" ON "SigaaAcademicSnapshot"("usuarioId", "installedByRunId");

-- CreateIndex
CREATE UNIQUE INDEX "SigaaSyncRun_usuarioId_idempotencyKey_key" ON "SigaaSyncRun"("usuarioId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "SigaaSyncRun_usuarioId_id_key" ON "SigaaSyncRun"("usuarioId", "id");

-- CreateIndex
CREATE INDEX "SigaaSyncRun_usuarioId_iniciadoEm_idx" ON "SigaaSyncRun"("usuarioId", "iniciadoEm");

-- CreateIndex
CREATE INDEX "SigaaSyncRun_status_leaseExpiresAt_idx" ON "SigaaSyncRun"("status", "leaseExpiresAt");

-- CreateIndex
CREATE INDEX "SigaaSyncRun_status_retentionExpiresAt_idx" ON "SigaaSyncRun"("status", "retentionExpiresAt");

-- CreateIndex
CREATE INDEX "SigaaRateLimitBucket_resetAt_idx" ON "SigaaRateLimitBucket"("resetAt");

-- AddForeignKey
ALTER TABLE "SigaaConnection" ADD CONSTRAINT "SigaaConnection_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SigaaSyncRun" ADD CONSTRAINT "SigaaSyncRun_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "SigaaConnection"("usuarioId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SigaaConnection" ADD CONSTRAINT "SigaaConnection_usuarioId_leaseRunId_fkey"
FOREIGN KEY ("usuarioId", "leaseRunId") REFERENCES "SigaaSyncRun"("usuarioId", "id")
ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SigaaAcademicSnapshot" ADD CONSTRAINT "SigaaAcademicSnapshot_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "SigaaConnection"("usuarioId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SigaaAcademicSnapshot" ADD CONSTRAINT "SigaaAcademicSnapshot_usuarioId_installedByRunId_fkey"
FOREIGN KEY ("usuarioId", "installedByRunId") REFERENCES "SigaaSyncRun"("usuarioId", "id")
ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SigaaRateLimitBucket" ADD CONSTRAINT "SigaaRateLimitBucket_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
