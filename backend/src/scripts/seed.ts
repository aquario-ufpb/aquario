import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeding de dados de desenvolvimento/teste...\n');
  console.log(
    '⚠️  Nota: Este script assume que os dados de referência (campus, centros, cursos, entidades)'
  );
  console.log(
    '   já foram criados. Execute "npm run db:init-production" primeiro se necessário.\n'
  );

  // Only delete test data, not reference data
  await prisma.subSecaoGuia.deleteMany();
  await prisma.secaoGuia.deleteMany();
  await prisma.guia.deleteMany();
  await prisma.publicacao.deleteMany();
  await prisma.itemAchadoEPerdido.deleteMany();
  await prisma.vaga.deleteMany();
  await prisma.projeto.deleteMany();
  await prisma.membroEntidade.deleteMany();
  await prisma.usuario.deleteMany();

  console.log('✅ Dados de teste antigos limpos.\n');

  // Find existing cursos (assume they exist from init-production)
  const cc = await prisma.curso.findUnique({
    where: { nome: 'Ciência da Computação' },
  });
  const ec = await prisma.curso.findUnique({
    where: { nome: 'Engenharia da Computação' },
  });
  const cdia = await prisma.curso.findUnique({
    where: { nome: 'Ciências de Dados e Inteligência Artificial' },
  });

  if (!cc || !ec || !cdia) {
    throw new Error(
      '❌ Cursos não encontrados. Execute "npm run db:init-production" primeiro para criar os dados de referência.'
    );
  }

  console.log('✅ Cursos encontrados (assumindo que dados de referência já existem).\n');

  // Create example guides (CC)
  const guia1 = await prisma.guia.create({
    data: {
      titulo: 'Guia de Introdução à Programação',
      slug: 'guia-introducao-programacao',
      descricao: 'Um guia completo para iniciantes em programação',
      status: 'ATIVO',
      cursoId: cc.id,
      tags: ['programação', 'iniciante', 'algoritmos'],
    },
  });

  const guia2 = await prisma.guia.create({
    data: {
      titulo: 'Estruturas de Dados Avançadas',
      slug: 'estruturas-dados-avancadas',
      descricao: 'Conceitos avançados de estruturas de dados',
      status: 'ATIVO',
      cursoId: cc.id,
      tags: ['estruturas de dados', 'algoritmos', 'avançado'],
    },
  });

  // Create example guides (EC)
  const guiaEc1 = await prisma.guia.create({
    data: {
      titulo: 'Sistemas Digitais',
      slug: 'sistemas-digitais',
      descricao: 'Portas lógicas, circuitos combinacionais e sequenciais',
      status: 'ATIVO',
      cursoId: ec.id,
      tags: ['hardware', 'eletrônica'],
    },
  });
  const guiaEc2 = await prisma.guia.create({
    data: {
      titulo: 'Arquitetura de Computadores',
      slug: 'arquitetura-de-computadores',
      descricao: 'Organização e arquitetura de computadores',
      status: 'ATIVO',
      cursoId: ec.id,
      tags: ['arquitetura', 'organização'],
    },
  });

  // Create example guides (CDIA)
  const guiaCd1 = await prisma.guia.create({
    data: {
      titulo: 'Introdução à Ciência de Dados',
      slug: 'introducao-a-ciencia-de-dados',
      descricao: 'Pipeline de dados, análise exploratória e visualização',
      status: 'ATIVO',
      cursoId: cdia.id,
      tags: ['ciência de dados', 'EDA', 'visualização'],
    },
  });
  const guiaCd2 = await prisma.guia.create({
    data: {
      titulo: 'Fundamentos de IA',
      slug: 'fundamentos-de-ia',
      descricao: 'Conceitos básicos de IA e aprendizagem de máquina',
      status: 'ATIVO',
      cursoId: cdia.id,
      tags: ['IA', 'ML'],
    },
  });

  // Create sections for guia1
  const secao1 = await prisma.secaoGuia.create({
    data: {
      guiaId: guia1.id,
      titulo: 'Conceitos Básicos',
      slug: 'conceitos-basicos',
      ordem: 1,
      conteudo: '# Conceitos Básicos\n\nEste capítulo aborda os fundamentos da programação...',
      status: 'ATIVO',
    },
  });

  const secao2 = await prisma.secaoGuia.create({
    data: {
      guiaId: guia1.id,
      titulo: 'Variáveis e Tipos',
      slug: 'variaveis-tipos',
      ordem: 2,
      conteudo: '# Variáveis e Tipos\n\nAs variáveis são fundamentais na programação...',
      status: 'ATIVO',
    },
  });

  // Create subsections for secao1
  await prisma.subSecaoGuia.create({
    data: {
      secaoId: secao1.id,
      titulo: 'O que é Programação?',
      slug: 'o-que-e-programacao',
      ordem: 1,
      conteudo: '## O que é Programação?\n\nProgramação é o processo de criar instruções...',
      status: 'ATIVO',
    },
  });

  await prisma.subSecaoGuia.create({
    data: {
      secaoId: secao1.id,
      titulo: 'Algoritmos',
      slug: 'algoritmos',
      ordem: 2,
      conteudo: '## Algoritmos\n\nUm algoritmo é uma sequência de passos...',
      status: 'ATIVO',
    },
  });

  // Create sections for EC
  const ecSec1 = await prisma.secaoGuia.create({
    data: {
      guiaId: guiaEc1.id,
      titulo: 'Portas Lógicas',
      slug: 'portas-logicas',
      ordem: 1,
      conteudo: '# Portas Lógicas\n\nAND, OR, NOT, NAND, NOR, XOR, XNOR...',
      status: 'ATIVO',
    },
  });
  await prisma.subSecaoGuia.create({
    data: {
      secaoId: ecSec1.id,
      titulo: 'Tabelas Verdade',
      slug: 'tabelas-verdade',
      ordem: 1,
      conteudo: '## Tabelas Verdade\n\nExemplos e exercícios...',
      status: 'ATIVO',
    },
  });
  const ecSec2 = await prisma.secaoGuia.create({
    data: {
      guiaId: guiaEc2.id,
      titulo: 'Circuitos Combinacionais',
      slug: 'circuitos-combinacionais',
      ordem: 2,
      conteudo: '# Circuitos Combinacionais\n\nSomadores, multiplexadores...',
      status: 'ATIVO',
    },
  });

  // Create subsection for ecSec2
  await prisma.subSecaoGuia.create({
    data: {
      secaoId: ecSec2.id,
      titulo: 'Somadores',
      slug: 'somadores',
      ordem: 1,
      conteudo: '## Somadores\n\nHalf-adder, full-adder...',
      status: 'ATIVO',
    },
  });

  await prisma.secaoGuia.create({
    data: {
      guiaId: guiaEc2.id,
      titulo: 'Conjunto de Instruções',
      slug: 'conjunto-de-instrucoes',
      ordem: 1,
      conteudo: '# ISA\n\nTipos de instruções, modos de endereçamento...',
      status: 'ATIVO',
    },
  });

  // Create sections for CDIA
  const cdSec1 = await prisma.secaoGuia.create({
    data: {
      guiaId: guiaCd1.id,
      titulo: 'Coleta e Limpeza de Dados',
      slug: 'coleta-e-limpeza-de-dados',
      ordem: 1,
      conteudo: '# Coleta e Limpeza\n\nTratamento de valores ausentes, outliers...',
      status: 'ATIVO',
    },
  });
  await prisma.subSecaoGuia.create({
    data: {
      secaoId: cdSec1.id,
      titulo: 'Normalização',
      slug: 'normalizacao',
      ordem: 1,
      conteudo: '## Normalização\n\nMin-Max, Z-score...',
      status: 'ATIVO',
    },
  });
  await prisma.secaoGuia.create({
    data: {
      guiaId: guiaCd2.id,
      titulo: 'Aprendizagem Supervisionada',
      slug: 'aprendizagem-supervisionada',
      ordem: 1,
      conteudo: '# Supervisionada\n\nRegressão, classificação...',
      status: 'ATIVO',
    },
  });

  console.log('Guias de exemplo criados (CC, EC, CDIA).');

  // Find centro for reference
  const ci = await prisma.centro.findUnique({
    where: { sigla: 'CI' },
  });

  console.log(`
--- IDs para Teste ---
`);
  if (ci) {
    console.log(`Centro de Informática (centroId): ${ci.id}`);
  }
  console.log(`Curso de CC (cursoId):          ${cc.id}`);
  console.log(`Curso de EC (cursoId):          ${ec.id}`);
  console.log(`Curso de CDIA (cursoId):        ${cdia.id}`);
  console.log(`Guia CC 1 (guiaId):              ${guia1.id}`);
  console.log(`Guia CC 2 (guiaId):              ${guia2.id}`);
  console.log(`Guia EC 1 (guiaId):              ${guiaEc1.id}`);
  console.log(`Guia EC 2 (guiaId):              ${guiaEc2.id}`);
  console.log(`Guia CDIA 1 (guiaId):            ${guiaCd1.id}`);
  console.log(`Guia CDIA 2 (guiaId):            ${guiaCd2.id}`);
  console.log(`Seção 1 (secaoId):               ${secao1.id}`);
  console.log(`Seção 2 (secaoId):               ${secao2.id}`);
  console.log(`
-----------------------
`);

  console.log('Seeding finalizado.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
