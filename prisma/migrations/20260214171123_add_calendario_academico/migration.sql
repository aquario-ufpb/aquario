-- CreateEnum
CREATE TYPE "CategoriaEvento" AS ENUM ('MATRICULA_INGRESSANTES', 'MATRICULA_VETERANOS', 'REMATRICULA', 'MATRICULA_EXTRAORDINARIA', 'PONTO_FACULTATIVO', 'FERIADO', 'EXAMES_FINAIS', 'REGISTRO_MEDIAS_FINAIS', 'COLACAO_DE_GRAU', 'INICIO_PERIODO_LETIVO', 'TERMINO_PERIODO_LETIVO', 'OUTRA');

-- CreateTable
CREATE TABLE "SemestreLetivo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SemestreLetivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoCalendario" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "categoria" "CategoriaEvento" NOT NULL DEFAULT 'OUTRA',
    "semestreId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventoCalendario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SemestreLetivo_nome_key" ON "SemestreLetivo"("nome");

-- CreateIndex
CREATE INDEX "SemestreLetivo_dataInicio_idx" ON "SemestreLetivo"("dataInicio");

-- CreateIndex
CREATE INDEX "SemestreLetivo_dataFim_idx" ON "SemestreLetivo"("dataFim");

-- CreateIndex
CREATE INDEX "EventoCalendario_semestreId_idx" ON "EventoCalendario"("semestreId");

-- CreateIndex
CREATE INDEX "EventoCalendario_dataInicio_idx" ON "EventoCalendario"("dataInicio");

-- CreateIndex
CREATE INDEX "EventoCalendario_categoria_idx" ON "EventoCalendario"("categoria");

-- AddForeignKey
ALTER TABLE "EventoCalendario" ADD CONSTRAINT "EventoCalendario_semestreId_fkey" FOREIGN KEY ("semestreId") REFERENCES "SemestreLetivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
