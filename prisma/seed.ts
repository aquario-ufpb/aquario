import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...\n");

  // ============================================================================
  // REFERENCE DATA (Campus, Centro, Cursos)
  // ============================================================================

  // Create Campus
  const campusI = await prisma.campus.upsert({
    where: { nome: "Campus I - João Pessoa" },
    update: {},
    create: { nome: "Campus I - João Pessoa" },
  });

  console.log("✅ Campus created");

  // Create Centro de Informática
  const ci = await prisma.centro.upsert({
    where: { sigla: "CI" },
    update: {},
    create: {
      nome: "Centro de Informática",
      sigla: "CI",
      descricao: "Centro de Informática da UFPB",
      campusId: campusI.id,
    },
  });

  console.log("✅ Centro de Informática created");

  // Create Cursos
  const cc = await prisma.curso.upsert({
    where: { nome: "Ciência da Computação" },
    update: {},
    create: {
      nome: "Ciência da Computação",
      centroId: ci.id,
    },
  });

  const ec = await prisma.curso.upsert({
    where: { nome: "Engenharia da Computação" },
    update: {},
    create: {
      nome: "Engenharia da Computação",
      centroId: ci.id,
    },
  });

  const cdia = await prisma.curso.upsert({
    where: { nome: "Ciência de Dados e Inteligência Artificial" },
    update: {},
    create: {
      nome: "Ciência de Dados e Inteligência Artificial",
      centroId: ci.id,
    },
  });

  const si = await prisma.curso.upsert({
    where: { nome: "Sistemas de Informação" },
    update: {},
    create: {
      nome: "Sistemas de Informação",
      centroId: ci.id,
    },
  });

  const mat = await prisma.curso.upsert({
    where: { nome: "Matemática Computacional" },
    update: {},
    create: {
      nome: "Matemática Computacional",
      centroId: ci.id,
    },
  });

  console.log("✅ Cursos created (CC, EC, CDIA, SI, Mat. Computacional)");

  // ============================================================================
  // EXAMPLE ENTIDADES (Labs)
  // ============================================================================

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const lasid = await prisma.entidade.upsert({
    where: { nome_tipo: { nome: "LASID", tipo: "LABORATORIO" } },
    update: {},
    create: {
      nome: "LASID",
      subtitle: "Laboratório de Sistemas Distribuídos",
      descricao: "Pesquisa em sistemas distribuídos, cloud computing e IoT",
      tipo: "LABORATORIO",
      centroId: ci.id,
      location: "CI - Bloco A",
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const lia = await prisma.entidade.upsert({
    where: { nome_tipo: { nome: "LIA", tipo: "LABORATORIO" } },
    update: {},
    create: {
      nome: "LIA",
      subtitle: "Laboratório de Inteligência Artificial",
      descricao: "Pesquisa em IA, Machine Learning e Deep Learning",
      tipo: "LABORATORIO",
      centroId: ci.id,
      location: "CI - Bloco B",
    },
  });

  console.log("✅ Example entidades created (LASID, LIA)");

  // ============================================================================
  // EXAMPLE GUIAS
  // ============================================================================

  // Delete existing test guides (for clean re-seed)
  await prisma.subSecaoGuia.deleteMany();
  await prisma.secaoGuia.deleteMany();
  await prisma.guia.deleteMany();

  // CC Guide
  const guiaCC = await prisma.guia.create({
    data: {
      titulo: "Guia de Introdução à Programação",
      slug: "guia-introducao-programacao",
      descricao: "Um guia completo para iniciantes em programação",
      status: "ATIVO",
      cursoId: cc.id,
      tags: ["programação", "iniciante", "algoritmos"],
    },
  });

  const secaoCC1 = await prisma.secaoGuia.create({
    data: {
      guiaId: guiaCC.id,
      titulo: "Conceitos Básicos",
      slug: "conceitos-basicos",
      ordem: 1,
      conteudo: "# Conceitos Básicos\n\nEste capítulo aborda os fundamentos da programação...",
      status: "ATIVO",
    },
  });

  await prisma.subSecaoGuia.create({
    data: {
      secaoId: secaoCC1.id,
      titulo: "O que é Programação?",
      slug: "o-que-e-programacao",
      ordem: 1,
      conteudo: "## O que é Programação?\n\nProgramação é o processo de criar instruções...",
      status: "ATIVO",
    },
  });

  // EC Guide
  const guiaEC = await prisma.guia.create({
    data: {
      titulo: "Sistemas Digitais",
      slug: "sistemas-digitais",
      descricao: "Portas lógicas, circuitos combinacionais e sequenciais",
      status: "ATIVO",
      cursoId: ec.id,
      tags: ["hardware", "eletrônica"],
    },
  });

  await prisma.secaoGuia.create({
    data: {
      guiaId: guiaEC.id,
      titulo: "Portas Lógicas",
      slug: "portas-logicas",
      ordem: 1,
      conteudo: "# Portas Lógicas\n\nAND, OR, NOT, NAND, NOR, XOR, XNOR...",
      status: "ATIVO",
    },
  });

  // CDIA Guide
  const guiaCDIA = await prisma.guia.create({
    data: {
      titulo: "Introdução à Ciência de Dados",
      slug: "introducao-ciencia-dados",
      descricao: "Pipeline de dados, análise exploratória e visualização",
      status: "ATIVO",
      cursoId: cdia.id,
      tags: ["ciência de dados", "EDA", "visualização"],
    },
  });

  await prisma.secaoGuia.create({
    data: {
      guiaId: guiaCDIA.id,
      titulo: "Coleta e Limpeza de Dados",
      slug: "coleta-limpeza-dados",
      ordem: 1,
      conteudo: "# Coleta e Limpeza\n\nTratamento de valores ausentes, outliers...",
      status: "ATIVO",
    },
  });

  console.log("✅ Example guias created (CC, EC, CDIA)");

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🌱 Seed Complete!                         ║
╠══════════════════════════════════════════════════════════════╣
║  Reference Data:                                             ║
║    - Campus: ${campusI.id.slice(0, 8)}...                              ║
║    - Centro (CI): ${ci.id.slice(0, 8)}...                          ║
║    - Cursos: CC, EC, CDIA, SI, Mat. Comp.                    ║
║                                                              ║
║  Test Data:                                                  ║
║    - Entidades: LASID, LIA                                   ║
║    - Guias: 3 example guides with sections                   ║
╚══════════════════════════════════════════════════════════════╝

IDs for testing:
  centroId: ${ci.id}
  cursoCC:  ${cc.id}
  cursoEC:  ${ec.id}
  cursoCDIA: ${cdia.id}
  cursoSI:  ${si.id}
  cursoMat: ${mat.id}
`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
