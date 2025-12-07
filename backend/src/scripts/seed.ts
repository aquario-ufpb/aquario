import { PrismaClient, TipoEntidade } from '@prisma/client';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

// Map JSON tipo values to database TipoEntidade enum
function mapTipo(jsonTipo: string): TipoEntidade {
  const tipoMap: Record<string, TipoEntidade> = {
    LABORATORIO: TipoEntidade.LABORATORIO,
    GRUPO: TipoEntidade.GRUPO,
    GRUPO_PESQUISA: TipoEntidade.GRUPO, // Map old value to new GRUPO
    GRUPO_ESTUDANTIL: TipoEntidade.GRUPO, // Map to GRUPO
    LIGA_ACADEMICA: TipoEntidade.LIGA_ACADEMICA,
    LIGA_ESTUDANTIL: TipoEntidade.LIGA_ACADEMICA, // Map to LIGA_ACADEMICA
    EMPRESA: TipoEntidade.EMPRESA,
    ATLETICA: TipoEntidade.ATLETICA,
    CENTRO_ACADEMICO: TipoEntidade.CENTRO_ACADEMICO,
    OUTRO: TipoEntidade.OUTRO,
  };

  return tipoMap[jsonTipo] || TipoEntidade.OUTRO;
}

interface EntityJson {
  name: string;
  subtitle?: string;
  description?: string;
  tipo: string;
  imagePath?: string;
  contato_email?: string;
  instagram?: string;
  linkedin?: string;
  website?: string;
  location?: string;
  people?: Array<{
    name: string;
    email: string;
    role: string;
    profession: string;
  }>;
}

async function main() {
  console.log('Iniciando o seeding...');

  await prisma.subSecaoGuia.deleteMany();
  await prisma.secaoGuia.deleteMany();
  await prisma.guia.deleteMany();
  await prisma.publicacao.deleteMany();
  await prisma.itemAchadoEPerdido.deleteMany();
  await prisma.vaga.deleteMany();
  await prisma.projeto.deleteMany();
  await prisma.membroEntidade.deleteMany();
  await prisma.entidade.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.curso.deleteMany();
  await prisma.centro.deleteMany();
  await prisma.campus.deleteMany();

  console.log('Dados antigos limpos.');

  const campus1 = await prisma.campus.create({
    data: {
      nome: 'Campus I - João Pessoa',
    },
  });

  const ci = await prisma.centro.create({
    data: {
      nome: 'Centro de Informática',
      sigla: 'CI',
      campusId: campus1.id,
    },
  });

  await prisma.curso.createMany({
    data: [
      { nome: 'Ciência da Computação', centroId: ci.id },
      { nome: 'Engenharia da Computação', centroId: ci.id },
      { nome: 'Ciências de Dados e Inteligência Artificial', centroId: ci.id },
    ],
  });

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
    throw new Error('Erro ao buscar cursos no seed.');
  }

  console.log('Campi, Centros e Cursos criados.');

  // Load entities from JSON files
  // Path from backend directory to frontend/content/aquario-entidades/centro-de-informatica
  const entitiesDir = join(
    process.cwd(),
    '../frontend/content/aquario-entidades/centro-de-informatica'
  );
  const jsonFiles = readdirSync(entitiesDir).filter(file => file.endsWith('.json'));

  console.log(`Encontrados ${jsonFiles.length} arquivos JSON de entidades.`);

  const entities = [];
  for (const file of jsonFiles) {
    try {
      const filePath = join(entitiesDir, file);
      const fileContent = readFileSync(filePath, 'utf-8');
      const entityJson: EntityJson = JSON.parse(fileContent);

      // Map JSON to database structure
      const tipo = mapTipo(entityJson.tipo);
      const descricao = entityJson.description || entityJson.subtitle || null;
      const contato = entityJson.contato_email || null;

      // Extract image filename from imagePath (e.g., "./assets/ARIA.png" -> "ARIA.png")
      let urlFoto = null;
      if (entityJson.imagePath) {
        const imageMatch = entityJson.imagePath.match(/assets\/(.+)$/);
        if (imageMatch) {
          urlFoto = imageMatch[1];
        }
      }

      entities.push({
        nome: entityJson.name,
        descricao,
        tipo,
        urlFoto,
        contato,
        centroId: ci.id,
      });
    } catch (error) {
      console.error(`Erro ao processar arquivo ${file}:`, error);
    }
  }

  // Create entities in database
  for (const entityData of entities) {
    try {
      await prisma.entidade.create({
        data: entityData,
      });
      console.log(`- Entidade '${entityData.nome}' criada com sucesso.`);
    } catch (error) {
      console.error(`Falha ao criar entidade '${entityData.nome}':`, error);
    }
  }

  console.log(`${entities.length} entidades criadas.`);

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

  console.log(`
--- IDs para Teste ---
`);
  console.log(`Centro de Informática (centroId): ${ci.id}`);
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
