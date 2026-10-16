/** Minimal, repeatable seed for local registration. Preserves existing content. */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
async function main() {
  const campus = await prisma.campus.upsert({
    where: { nome: "Campus I - João Pessoa" },
    update: {},
    create: { nome: "Campus I - João Pessoa" },
  });
  const center = await prisma.centro.upsert({
    where: { sigla: "CI" },
    update: {},
    create: {
      nome: "Centro de Informática",
      sigla: "CI",
      descricao: "Centro de Informática da UFPB",
      campusId: campus.id,
    },
  });
  for (const name of [
    "Ciência da Computação",
    "Engenharia da Computação",
    "Ciência de Dados e Inteligência Artificial",
    "Engenharia de Robôs",
  ]) {
    await prisma.curso.upsert({
      where: { nome: name },
      update: {},
      create: { nome: name, centroId: center.id },
    });
  }
  const other = await prisma.centro.upsert({
    where: { sigla: "OUTRO" },
    update: {},
    create: {
      nome: "Outro",
      sigla: "OUTRO",
      descricao: "Para estudantes de outros centros",
      campusId: campus.id,
    },
  });
  await prisma.curso.upsert({
    where: { nome: "Outro" },
    update: {},
    create: { nome: "Outro", centroId: other.id },
  });
  console.log("Cadastro preparado: Campus I, CI/Outro e cinco cursos disponíveis.");
}
main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
