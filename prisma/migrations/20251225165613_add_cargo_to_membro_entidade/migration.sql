-- AlterTable
ALTER TABLE "MembroEntidade" ADD COLUMN     "cargoId" TEXT;

-- CreateTable
CREATE TABLE "Cargo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "entidadeId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cargo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cargo_entidadeId_idx" ON "Cargo"("entidadeId");

-- CreateIndex
CREATE INDEX "Cargo_ordem_idx" ON "Cargo"("ordem");

-- CreateIndex
CREATE INDEX "MembroEntidade_cargoId_idx" ON "MembroEntidade"("cargoId");

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_entidadeId_fkey" FOREIGN KEY ("entidadeId") REFERENCES "Entidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembroEntidade" ADD CONSTRAINT "MembroEntidade_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
