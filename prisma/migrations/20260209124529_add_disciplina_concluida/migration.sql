-- CreateTable
CREATE TABLE "DisciplinaConcluida" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "disciplinaId" TEXT NOT NULL,
    "concluidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisciplinaConcluida_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DisciplinaConcluida_usuarioId_idx" ON "DisciplinaConcluida"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "DisciplinaConcluida_usuarioId_disciplinaId_key" ON "DisciplinaConcluida"("usuarioId", "disciplinaId");

-- AddForeignKey
ALTER TABLE "DisciplinaConcluida" ADD CONSTRAINT "DisciplinaConcluida_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisciplinaConcluida" ADD CONSTRAINT "DisciplinaConcluida_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
