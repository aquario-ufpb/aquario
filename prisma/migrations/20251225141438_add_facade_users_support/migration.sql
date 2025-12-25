-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "eFacade" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "senhaHash" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_matricula_idx" ON "Usuario"("matricula");

-- CreateIndex
CREATE INDEX "Usuario_eFacade_idx" ON "Usuario"("eFacade");
