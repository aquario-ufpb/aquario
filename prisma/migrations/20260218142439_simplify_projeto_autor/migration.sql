-- CreateEnum
CREATE TYPE "StatusProjeto" AS ENUM ('RASCUNHO', 'PUBLICADO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "TipoConteudo" AS ENUM ('MARKDOWN', 'HTML', 'TEXTO_SIMPLES');

-- CreateTable
CREATE TABLE "Projeto" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subtitulo" TEXT,
    "descricao" TEXT,
    "textContent" TEXT,
    "tipoConteudo" "TipoConteudo" NOT NULL DEFAULT 'MARKDOWN',
    "urlImagem" TEXT,
    "status" "StatusProjeto" NOT NULL DEFAULT 'RASCUNHO',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "urlRepositorio" TEXT,
    "urlDemo" TEXT,
    "urlPublicacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "publicadoEm" TIMESTAMP(3),
    "entidadeId" TEXT,

    CONSTRAINT "Projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjetoAutor" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "autorPrincipal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProjetoAutor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Projeto_slug_key" ON "Projeto"("slug");

-- CreateIndex
CREATE INDEX "Projeto_slug_idx" ON "Projeto"("slug");

-- CreateIndex
CREATE INDEX "Projeto_status_idx" ON "Projeto"("status");

-- CreateIndex
CREATE INDEX "Projeto_entidadeId_idx" ON "Projeto"("entidadeId");

-- CreateIndex
CREATE INDEX "Projeto_criadoEm_idx" ON "Projeto"("criadoEm");

-- CreateIndex
CREATE INDEX "Projeto_publicadoEm_idx" ON "Projeto"("publicadoEm");

-- CreateIndex
CREATE INDEX "ProjetoAutor_projetoId_idx" ON "ProjetoAutor"("projetoId");

-- CreateIndex
CREATE INDEX "ProjetoAutor_usuarioId_idx" ON "ProjetoAutor"("usuarioId");

-- CreateIndex
CREATE INDEX "ProjetoAutor_autorPrincipal_idx" ON "ProjetoAutor"("autorPrincipal");

-- CreateIndex
CREATE UNIQUE INDEX "ProjetoAutor_projetoId_usuarioId_key" ON "ProjetoAutor"("projetoId", "usuarioId");

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_entidadeId_fkey" FOREIGN KEY ("entidadeId") REFERENCES "Entidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjetoAutor" ADD CONSTRAINT "ProjetoAutor_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjetoAutor" ADD CONSTRAINT "ProjetoAutor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
