-- CreateTable
CREATE TABLE "DisciplinaSemestre" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "semestreLetivoId" TEXT NOT NULL,
    "disciplinaId" TEXT NOT NULL,
    "turma" TEXT,
    "docente" TEXT,
    "horario" TEXT,
    "codigoPaas" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisciplinaSemestre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DisciplinaSemestre_usuarioId_idx" ON "DisciplinaSemestre"("usuarioId");

-- CreateIndex
CREATE INDEX "DisciplinaSemestre_usuarioId_semestreLetivoId_idx" ON "DisciplinaSemestre"("usuarioId", "semestreLetivoId");

-- CreateIndex
CREATE UNIQUE INDEX "DisciplinaSemestre_usuarioId_semestreLetivoId_disciplinaId_key" ON "DisciplinaSemestre"("usuarioId", "semestreLetivoId", "disciplinaId");

-- AddForeignKey
ALTER TABLE "DisciplinaSemestre" ADD CONSTRAINT "DisciplinaSemestre_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinaSemestre" ADD CONSTRAINT "DisciplinaSemestre_semestreLetivoId_fkey" FOREIGN KEY ("semestreLetivoId") REFERENCES "SemestreLetivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinaSemestre" ADD CONSTRAINT "DisciplinaSemestre_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
