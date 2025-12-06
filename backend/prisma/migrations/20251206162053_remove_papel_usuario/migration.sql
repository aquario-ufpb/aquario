/*
  Warnings:

  - You are about to drop the column `papel` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `periodo` on the `Usuario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Usuario" DROP COLUMN "papel",
DROP COLUMN "periodo";

-- DropEnum
DROP TYPE "public"."PapelUsuario";
