-- CreateEnum
CREATE TYPE "PapelPlataforma" AS ENUM ('USER', 'MASTER_ADMIN');

-- CreateEnum
CREATE TYPE "TipoToken" AS ENUM ('VERIFICACAO_EMAIL', 'RESET_SENHA');

-- CreateEnum
CREATE TYPE "TipoEntidade" AS ENUM ('LABORATORIO', 'GRUPO', 'LIGA_ACADEMICA', 'EMPRESA', 'ATLETICA', 'CENTRO_ACADEMICO', 'OUTRO');

-- CreateEnum
CREATE TYPE "PapelMembro" AS ENUM ('ADMIN', 'MEMBRO');

-- CreateEnum
CREATE TYPE "StatusGuia" AS ENUM ('ATIVO', 'INATIVO', 'RASCUNHO');

-- CreateTable
CREATE TABLE "Campus" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Centro" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "descricao" TEXT,
    "campusId" TEXT NOT NULL,

    CONSTRAINT "Centro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Curso" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "centroId" TEXT NOT NULL,

    CONSTRAINT "Curso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "matricula" TEXT,
    "senhaHash" TEXT NOT NULL,
    "permissoes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "papelPlataforma" "PapelPlataforma" NOT NULL DEFAULT 'USER',
    "eVerificado" BOOLEAN NOT NULL DEFAULT false,
    "urlFotoPerfil" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "centroId" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenVerificacao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tipo" "TipoToken" NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenVerificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entidade" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "subtitle" TEXT,
    "descricao" TEXT,
    "tipo" "TipoEntidade" NOT NULL,
    "urlFoto" TEXT,
    "contato" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "website" TEXT,
    "location" TEXT,
    "foundingDate" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "centroId" TEXT NOT NULL,

    CONSTRAINT "Entidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembroEntidade" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "papel" "PapelMembro" NOT NULL,

    CONSTRAINT "MembroEntidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guia" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusGuia" NOT NULL DEFAULT 'RASCUNHO',
    "cursoId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecaoGuia" (
    "id" TEXT NOT NULL,
    "guiaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "conteudo" TEXT,
    "status" "StatusGuia" NOT NULL DEFAULT 'RASCUNHO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecaoGuia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubSecaoGuia" (
    "id" TEXT NOT NULL,
    "secaoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "conteudo" TEXT,
    "status" "StatusGuia" NOT NULL DEFAULT 'RASCUNHO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubSecaoGuia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Campus_nome_key" ON "Campus"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Centro_nome_key" ON "Centro"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Centro_sigla_key" ON "Centro"("sigla");

-- CreateIndex
CREATE UNIQUE INDEX "Curso_nome_key" ON "Curso"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_matricula_key" ON "Usuario"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "TokenVerificacao_token_key" ON "TokenVerificacao"("token");

-- CreateIndex
CREATE INDEX "TokenVerificacao_token_idx" ON "TokenVerificacao"("token");

-- CreateIndex
CREATE INDEX "TokenVerificacao_usuarioId_idx" ON "TokenVerificacao"("usuarioId");

-- CreateIndex
CREATE INDEX "TokenVerificacao_expiraEm_idx" ON "TokenVerificacao"("expiraEm");

-- CreateIndex
CREATE UNIQUE INDEX "Entidade_nome_tipo_key" ON "Entidade"("nome", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "MembroEntidade_usuarioId_entidadeId_key" ON "MembroEntidade"("usuarioId", "entidadeId");

-- CreateIndex
CREATE UNIQUE INDEX "Guia_slug_key" ON "Guia"("slug");

-- CreateIndex
CREATE INDEX "Guia_cursoId_idx" ON "Guia"("cursoId");

-- CreateIndex
CREATE INDEX "Guia_slug_idx" ON "Guia"("slug");

-- CreateIndex
CREATE INDEX "Guia_status_idx" ON "Guia"("status");

-- CreateIndex
CREATE INDEX "Guia_criadoEm_idx" ON "Guia"("criadoEm");

-- CreateIndex
CREATE INDEX "SecaoGuia_guiaId_idx" ON "SecaoGuia"("guiaId");

-- CreateIndex
CREATE INDEX "SecaoGuia_ordem_idx" ON "SecaoGuia"("ordem");

-- CreateIndex
CREATE INDEX "SecaoGuia_status_idx" ON "SecaoGuia"("status");

-- CreateIndex
CREATE INDEX "SubSecaoGuia_secaoId_idx" ON "SubSecaoGuia"("secaoId");

-- CreateIndex
CREATE INDEX "SubSecaoGuia_ordem_idx" ON "SubSecaoGuia"("ordem");

-- CreateIndex
CREATE INDEX "SubSecaoGuia_status_idx" ON "SubSecaoGuia"("status");

-- AddForeignKey
ALTER TABLE "Centro" ADD CONSTRAINT "Centro_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Curso" ADD CONSTRAINT "Curso_centroId_fkey" FOREIGN KEY ("centroId") REFERENCES "Centro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_centroId_fkey" FOREIGN KEY ("centroId") REFERENCES "Centro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenVerificacao" ADD CONSTRAINT "TokenVerificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entidade" ADD CONSTRAINT "Entidade_centroId_fkey" FOREIGN KEY ("centroId") REFERENCES "Centro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembroEntidade" ADD CONSTRAINT "MembroEntidade_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembroEntidade" ADD CONSTRAINT "MembroEntidade_entidadeId_fkey" FOREIGN KEY ("entidadeId") REFERENCES "Entidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guia" ADD CONSTRAINT "Guia_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecaoGuia" ADD CONSTRAINT "SecaoGuia_guiaId_fkey" FOREIGN KEY ("guiaId") REFERENCES "Guia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubSecaoGuia" ADD CONSTRAINT "SubSecaoGuia_secaoId_fkey" FOREIGN KEY ("secaoId") REFERENCES "SecaoGuia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
