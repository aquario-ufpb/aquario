-- DropForeignKey
ALTER TABLE "MembroEntidade" DROP CONSTRAINT "MembroEntidade_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Vaga" DROP CONSTRAINT "Vaga_criadoPorUsuarioId_fkey";

-- AlterTable
ALTER TABLE "Vaga" ALTER COLUMN "criadoPorUsuarioId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "MembroEntidade" ADD CONSTRAINT "MembroEntidade_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vaga" ADD CONSTRAINT "Vaga_criadoPorUsuarioId_fkey" FOREIGN KEY ("criadoPorUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

