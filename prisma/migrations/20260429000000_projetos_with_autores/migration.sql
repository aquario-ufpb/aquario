-- CreateEnum
CREATE TYPE "StatusProjeto" AS ENUM ('RASCUNHO', 'PUBLICADO', 'ARQUIVADO');

-- CreateTable
CREATE TABLE "Projeto" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subtitulo" TEXT,
    "textContent" TEXT,
    "urlImagem" TEXT,
    "status" "StatusProjeto" NOT NULL DEFAULT 'RASCUNHO',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "urlRepositorio" TEXT,
    "urlDemo" TEXT,
    "urlOutro" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "publicadoEm" TIMESTAMP(3),

    CONSTRAINT "Projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjetoAutor" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "entidadeId" TEXT,
    "autorPrincipal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProjetoAutor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Projeto_slug_key" ON "Projeto"("slug");

-- CreateIndex
CREATE INDEX "Projeto_status_idx" ON "Projeto"("status");

-- CreateIndex
CREATE INDEX "Projeto_criadoEm_idx" ON "Projeto"("criadoEm");

-- CreateIndex
CREATE INDEX "Projeto_publicadoEm_idx" ON "Projeto"("publicadoEm");

-- CreateIndex
CREATE INDEX "ProjetoAutor_projetoId_idx" ON "ProjetoAutor"("projetoId");

-- CreateIndex
CREATE INDEX "ProjetoAutor_usuarioId_idx" ON "ProjetoAutor"("usuarioId");

-- CreateIndex
CREATE INDEX "ProjetoAutor_entidadeId_idx" ON "ProjetoAutor"("entidadeId");

-- CreateIndex
CREATE INDEX "ProjetoAutor_autorPrincipal_idx" ON "ProjetoAutor"("autorPrincipal");

-- AddForeignKey
ALTER TABLE "ProjetoAutor" ADD CONSTRAINT "ProjetoAutor_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjetoAutor" ADD CONSTRAINT "ProjetoAutor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjetoAutor" ADD CONSTRAINT "ProjetoAutor_entidadeId_fkey" FOREIGN KEY ("entidadeId") REFERENCES "Entidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Require at least one of usuarioId / entidadeId
ALTER TABLE "ProjetoAutor" ADD CONSTRAINT "ProjetoAutor_author_required" CHECK ("usuarioId" IS NOT NULL OR "entidadeId" IS NOT NULL);

-- Exactly one principal author per projeto. Zod enforces this on every write,
-- but the partial unique index protects against any path that bypasses
-- validation (raw SQL, replaceAutores bugs, future scripts).
CREATE UNIQUE INDEX "ProjetoAutor_projetoId_principal_unique" ON "ProjetoAutor"("projetoId") WHERE "autorPrincipal" = true;

-- A given user / entidade can appear at most once per projeto
CREATE UNIQUE INDEX "ProjetoAutor_projetoId_usuarioId_unique" ON "ProjetoAutor"("projetoId", "usuarioId") WHERE "usuarioId" IS NOT NULL;
CREATE UNIQUE INDEX "ProjetoAutor_projetoId_entidadeId_unique" ON "ProjetoAutor"("projetoId", "entidadeId") WHERE "entidadeId" IS NOT NULL;
