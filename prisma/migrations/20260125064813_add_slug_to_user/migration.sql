/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_slug_key" ON "Usuario"("slug");

-- CreateIndex
CREATE INDEX "Usuario_slug_idx" ON "Usuario"("slug");
