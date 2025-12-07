-- CreateEnum
CREATE TYPE "public"."TipoToken" AS ENUM ('VERIFICACAO_EMAIL', 'RESET_SENHA');

-- CreateTable
CREATE TABLE "public"."TokenVerificacao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tipo" "public"."TipoToken" NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenVerificacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenVerificacao_token_key" ON "public"."TokenVerificacao"("token");

-- CreateIndex
CREATE INDEX "TokenVerificacao_token_idx" ON "public"."TokenVerificacao"("token");

-- CreateIndex
CREATE INDEX "TokenVerificacao_usuarioId_idx" ON "public"."TokenVerificacao"("usuarioId");

-- CreateIndex
CREATE INDEX "TokenVerificacao_expiraEm_idx" ON "public"."TokenVerificacao"("expiraEm");

-- AddForeignKey
ALTER TABLE "public"."TokenVerificacao" ADD CONSTRAINT "TokenVerificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
