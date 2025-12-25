-- DropIndex
DROP INDEX "MembroEntidade_usuarioId_entidadeId_key";

-- AlterTable
ALTER TABLE "MembroEntidade" ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "MembroEntidade_usuarioId_entidadeId_idx" ON "MembroEntidade"("usuarioId", "entidadeId");

-- CreateIndex
CREATE INDEX "MembroEntidade_endedAt_idx" ON "MembroEntidade"("endedAt");

-- CreatePartialUniqueIndex
-- Ensures only one active membership (endedAt IS NULL) per user-entity pair
CREATE UNIQUE INDEX "MembroEntidade_usuarioId_entidadeId_endedAt_key" ON "MembroEntidade"("usuarioId", "entidadeId") WHERE "endedAt" IS NULL;
