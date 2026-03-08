-- CreateEnum
CREATE TYPE "TipoVaga" AS ENUM ('ESTAGIO', 'TRAINEE', 'VOLUNTARIO', 'PESQUISA', 'CLT', 'PJ', 'OUTRO');

-- CreateTable
CREATE TABLE "Vaga" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipoVaga" "TipoVaga" NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "criadoPorUsuarioId" TEXT NOT NULL,
    "linkInscricao" TEXT NOT NULL,
    "dataFinalizacao" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "deletadoEm" TIMESTAMP(3),
    "areas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "salario" TEXT,
    "sobreEmpresa" TEXT,
    "responsabilidades" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requisitos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "informacoesAdicionais" TEXT,
    "etapasProcesso" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Vaga_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vaga_entidadeId_idx" ON "Vaga"("entidadeId");

-- CreateIndex
CREATE INDEX "Vaga_dataFinalizacao_idx" ON "Vaga"("dataFinalizacao");

-- CreateIndex
CREATE INDEX "Vaga_deletadoEm_idx" ON "Vaga"("deletadoEm");

-- CreateIndex
CREATE INDEX "Vaga_criadoEm_idx" ON "Vaga"("criadoEm");

-- AddForeignKey
ALTER TABLE "Vaga" ADD CONSTRAINT "Vaga_entidadeId_fkey" FOREIGN KEY ("entidadeId") REFERENCES "Entidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vaga" ADD CONSTRAINT "Vaga_criadoPorUsuarioId_fkey" FOREIGN KEY ("criadoPorUsuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
