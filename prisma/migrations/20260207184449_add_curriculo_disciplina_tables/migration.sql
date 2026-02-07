-- CreateEnum
CREATE TYPE "NaturezaDisciplina" AS ENUM ('OBRIGATORIA', 'OPTATIVA', 'COMPLEMENTAR_FLEXIVA');

-- CreateTable
CREATE TABLE "Curriculo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "cursoId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Curriculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disciplina" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargaHorariaTotal" INTEGER,
    "cargaHorariaTeoria" INTEGER,
    "cargaHorariaPratica" INTEGER,
    "departamento" TEXT,
    "modalidade" TEXT,
    "ementa" TEXT,

    CONSTRAINT "Disciplina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurriculoDisciplina" (
    "id" TEXT NOT NULL,
    "curriculoId" TEXT NOT NULL,
    "disciplinaId" TEXT NOT NULL,
    "natureza" "NaturezaDisciplina" NOT NULL,
    "periodo" INTEGER NOT NULL,

    CONSTRAINT "CurriculoDisciplina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreRequisitoDisciplina" (
    "id" TEXT NOT NULL,
    "curriculoDisciplinaId" TEXT NOT NULL,
    "disciplinaRequeridaId" TEXT NOT NULL,

    CONSTRAINT "PreRequisitoDisciplina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equivalencia" (
    "id" TEXT NOT NULL,
    "disciplinaOrigemId" TEXT NOT NULL,
    "disciplinaEquivalenteId" TEXT NOT NULL,

    CONSTRAINT "Equivalencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Curriculo_cursoId_idx" ON "Curriculo"("cursoId");

-- CreateIndex
CREATE UNIQUE INDEX "Curriculo_cursoId_codigo_key" ON "Curriculo"("cursoId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Disciplina_codigo_key" ON "Disciplina"("codigo");

-- CreateIndex
CREATE INDEX "CurriculoDisciplina_curriculoId_idx" ON "CurriculoDisciplina"("curriculoId");

-- CreateIndex
CREATE INDEX "CurriculoDisciplina_disciplinaId_idx" ON "CurriculoDisciplina"("disciplinaId");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculoDisciplina_curriculoId_disciplinaId_key" ON "CurriculoDisciplina"("curriculoId", "disciplinaId");

-- CreateIndex
CREATE INDEX "PreRequisitoDisciplina_curriculoDisciplinaId_idx" ON "PreRequisitoDisciplina"("curriculoDisciplinaId");

-- CreateIndex
CREATE UNIQUE INDEX "PreRequisitoDisciplina_curriculoDisciplinaId_disciplinaRequ_key" ON "PreRequisitoDisciplina"("curriculoDisciplinaId", "disciplinaRequeridaId");

-- CreateIndex
CREATE UNIQUE INDEX "Equivalencia_disciplinaOrigemId_disciplinaEquivalenteId_key" ON "Equivalencia"("disciplinaOrigemId", "disciplinaEquivalenteId");

-- AddForeignKey
ALTER TABLE "Curriculo" ADD CONSTRAINT "Curriculo_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculoDisciplina" ADD CONSTRAINT "CurriculoDisciplina_curriculoId_fkey" FOREIGN KEY ("curriculoId") REFERENCES "Curriculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurriculoDisciplina" ADD CONSTRAINT "CurriculoDisciplina_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreRequisitoDisciplina" ADD CONSTRAINT "PreRequisitoDisciplina_curriculoDisciplinaId_fkey" FOREIGN KEY ("curriculoDisciplinaId") REFERENCES "CurriculoDisciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreRequisitoDisciplina" ADD CONSTRAINT "PreRequisitoDisciplina_disciplinaRequeridaId_fkey" FOREIGN KEY ("disciplinaRequeridaId") REFERENCES "Disciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equivalencia" ADD CONSTRAINT "Equivalencia_disciplinaOrigemId_fkey" FOREIGN KEY ("disciplinaOrigemId") REFERENCES "Disciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equivalencia" ADD CONSTRAINT "Equivalencia_disciplinaEquivalenteId_fkey" FOREIGN KEY ("disciplinaEquivalenteId") REFERENCES "Disciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
