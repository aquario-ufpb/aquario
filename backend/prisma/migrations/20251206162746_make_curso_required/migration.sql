/*
  Warnings:

  - Made the column `cursoId` on table `Usuario` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Usuario" DROP CONSTRAINT "Usuario_cursoId_fkey";

-- AlterTable
ALTER TABLE "public"."Usuario" ALTER COLUMN "cursoId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Usuario" ADD CONSTRAINT "Usuario_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "public"."Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
