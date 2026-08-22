CREATE TYPE "SigaaCourseChangeProposalState" AS ENUM ('PENDING', 'CONSUMED', 'SUPERSEDED');

ALTER TABLE "SigaaSyncRun"
ADD COLUMN "confirmationProposalId" TEXT;

CREATE TABLE "SigaaCourseChangeProposal" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "initiatingRunId" TEXT NOT NULL,
    "profileAcademicIdentityToken" CHAR(64) NOT NULL,
    "targetCourseId" TEXT NOT NULL,
    "targetCatalogToken" CHAR(64) NOT NULL,
    "sourceCourseLabel" VARCHAR(255) NOT NULL,
    "profileMatricula" VARCHAR(11),
    "expectedMatricula" VARCHAR(11) NOT NULL,
    "aliasVersion" VARCHAR(64) NOT NULL,
    "consentVersion" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "state" "SigaaCourseChangeProposalState" NOT NULL DEFAULT 'PENDING',
    "consumedAt" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SigaaCourseChangeProposal_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SigaaCourseChangeProposal_profile_token_check" CHECK ("profileAcademicIdentityToken" ~ '^[0-9a-f]{64}$'),
    CONSTRAINT "SigaaCourseChangeProposal_target_token_check" CHECK ("targetCatalogToken" ~ '^[0-9a-f]{64}$'),
    CONSTRAINT "SigaaCourseChangeProposal_profile_matricula_check" CHECK ("profileMatricula" IS NULL OR "profileMatricula" ~ '^[0-9]{11}$'),
    CONSTRAINT "SigaaCourseChangeProposal_matricula_check" CHECK ("expectedMatricula" ~ '^[0-9]{11}$'),
    CONSTRAINT "SigaaCourseChangeProposal_lifecycle_check" CHECK (
      ("state" = 'CONSUMED' AND "consumedAt" IS NOT NULL)
      OR ("state" <> 'CONSUMED' AND "consumedAt" IS NULL)
    )
);

CREATE UNIQUE INDEX "SigaaCourseChangeProposal_initiatingRunId_key"
ON "SigaaCourseChangeProposal"("initiatingRunId");

CREATE INDEX "SigaaCourseChangeProposal_usuarioId_state_expiresAt_idx"
ON "SigaaCourseChangeProposal"("usuarioId", "state", "expiresAt");

CREATE INDEX "SigaaCourseChangeProposal_targetCourseId_idx"
ON "SigaaCourseChangeProposal"("targetCourseId");

CREATE INDEX "SigaaSyncRun_confirmationProposalId_idx"
ON "SigaaSyncRun"("confirmationProposalId");

ALTER TABLE "SigaaCourseChangeProposal"
ADD CONSTRAINT "SigaaCourseChangeProposal_usuarioId_fkey"
FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SigaaCourseChangeProposal"
ADD CONSTRAINT "SigaaCourseChangeProposal_initiatingRunId_fkey"
FOREIGN KEY ("initiatingRunId") REFERENCES "SigaaSyncRun"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SigaaCourseChangeProposal"
ADD CONSTRAINT "SigaaCourseChangeProposal_targetCourseId_fkey"
FOREIGN KEY ("targetCourseId") REFERENCES "Curso"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SigaaSyncRun"
ADD CONSTRAINT "SigaaSyncRun_confirmationProposalId_fkey"
FOREIGN KEY ("confirmationProposalId") REFERENCES "SigaaCourseChangeProposal"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
