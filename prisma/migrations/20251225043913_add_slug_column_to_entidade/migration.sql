/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Entidade` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Entidade" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Entidade_slug_key" ON "Entidade"("slug");

-- CreateIndex
CREATE INDEX "Entidade_slug_idx" ON "Entidade"("slug");
