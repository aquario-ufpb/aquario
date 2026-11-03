-- CreateTable
CREATE TABLE "DispositivoPush" (
    "token" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "plataforma" TEXT NOT NULL,
    "prazos" BOOLEAN NOT NULL DEFAULT false,
    "vagas" BOOLEAN NOT NULL DEFAULT false,
    "entidades" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispositivoPush_pkey" PRIMARY KEY ("token")
);

-- CreateIndex
CREATE INDEX "DispositivoPush_usuarioId_idx" ON "DispositivoPush"("usuarioId");

-- AddForeignKey
ALTER TABLE "DispositivoPush" ADD CONSTRAINT "DispositivoPush_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
