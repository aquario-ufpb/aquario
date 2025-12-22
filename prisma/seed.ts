import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// Prisma enum values (must match schema.prisma TipoEntidade)
type TipoEntidade =
  | "LABORATORIO"
  | "GRUPO"
  | "LIGA_ACADEMICA"
  | "EMPRESA"
  | "ATLETICA"
  | "CENTRO_ACADEMICO"
  | "OUTRO";

// Map JSON tipos to Prisma enum
const tipoMapping: Record<string, TipoEntidade> = {
  LABORATORIO: "LABORATORIO",
  GRUPO_ESTUDANTIL: "GRUPO",
  GRUPO: "GRUPO",
  LIGA_ACADEMICA: "LIGA_ACADEMICA",
  LIGA: "LIGA_ACADEMICA",
  EMPRESA: "EMPRESA",
  ATLETICA: "ATLETICA",
  CENTRO_ACADEMICO: "CENTRO_ACADEMICO",
  CA: "CENTRO_ACADEMICO",
  OUTRO: "OUTRO",
};

type EntidadeJson = {
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
  foundingDate?: string;
};

/**
 * Converts local imagePath (e.g., "./assets/Aquario.png") to API URL
 * The content-images API serves these at /api/content-images/entidades/assets/{filename}
 */
function convertImagePathToUrl(imagePath: string | undefined): string | null {
  if (!imagePath) {
    return null;
  }

  // Handle paths like "./assets/Aquario.png" or "assets/Aquario.png"
  const normalized = imagePath.replace(/^\.\//, "");
  if (normalized.startsWith("assets/")) {
    return `/api/content-images/entidades/${normalized}`;
  }

  // If it's already an absolute URL, keep it
  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("/")
  ) {
    return imagePath;
  }

  // Default: assume it's in the assets folder
  return `/api/content-images/entidades/assets/${normalized}`;
}

async function loadEntidadesFromSubmodule(centroId: string): Promise<number> {
  const entidadesDir = path.join(process.cwd(), "content/aquario-entidades/centro-de-informatica");

  if (!fs.existsSync(entidadesDir)) {
    console.log("⚠️  Submodule aquario-entidades not found, skipping...");
    return 0;
  }

  const files = fs.readdirSync(entidadesDir).filter(f => f.endsWith(".json"));
  let count = 0;

  for (const file of files) {
    try {
      const filePath = path.join(entidadesDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const data: EntidadeJson = JSON.parse(content);

      const tipo = tipoMapping[data.tipo] || "OUTRO";
      const urlFoto = convertImagePathToUrl(data.imagePath);

      await prisma.entidade.upsert({
        where: { nome_tipo: { nome: data.name, tipo } },
        update: {
          subtitle: data.subtitle || null,
          descricao: data.description || null,
          urlFoto,
          contato: data.contato_email || null,
          instagram: data.instagram || null,
          linkedin: data.linkedin || null,
          website: data.website || null,
          location: data.location || null,
          foundingDate: data.foundingDate ? new Date(data.foundingDate) : null,
        },
        create: {
          nome: data.name,
          subtitle: data.subtitle || null,
          descricao: data.description || null,
          tipo,
          urlFoto,
          contato: data.contato_email || null,
          instagram: data.instagram || null,
          linkedin: data.linkedin || null,
          website: data.website || null,
          location: data.location || null,
          foundingDate: data.foundingDate ? new Date(data.foundingDate) : null,
          centroId,
        },
      });
      count++;
    } catch (error) {
      console.error(`  ⚠️  Error loading ${file}:`, error);
    }
  }

  return count;
}

async function main() {
  console.log("🌱 Starting database seed...\n");

  // ============================================================================
  // REFERENCE DATA (Campus, Centro, Cursos)
  // ============================================================================

  const campusI = await prisma.campus.upsert({
    where: { nome: "Campus I - João Pessoa" },
    update: {},
    create: { nome: "Campus I - João Pessoa" },
  });

  console.log("✅ Campus created");

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

  const cc = await prisma.curso.upsert({
    where: { nome: "Ciência da Computação" },
    update: {},
    create: { nome: "Ciência da Computação", centroId: ci.id },
  });

  const ec = await prisma.curso.upsert({
    where: { nome: "Engenharia da Computação" },
    update: {},
    create: { nome: "Engenharia da Computação", centroId: ci.id },
  });

  const cdia = await prisma.curso.upsert({
    where: { nome: "Ciência de Dados e Inteligência Artificial" },
    update: {},
    create: { nome: "Ciência de Dados e Inteligência Artificial", centroId: ci.id },
  });

  const si = await prisma.curso.upsert({
    where: { nome: "Sistemas de Informação" },
    update: {},
    create: { nome: "Sistemas de Informação", centroId: ci.id },
  });

  const mat = await prisma.curso.upsert({
    where: { nome: "Matemática Computacional" },
    update: {},
    create: { nome: "Matemática Computacional", centroId: ci.id },
  });

  console.log("✅ Cursos created (CC, EC, CDIA, SI, Mat. Computacional)");

  // ============================================================================
  // ENTIDADES (from aquario-entidades submodule)
  // ============================================================================

  const entidadeCount = await loadEntidadesFromSubmodule(ci.id);
  console.log(`✅ Entidades loaded from submodule: ${entidadeCount}`);

  // ============================================================================
  // EXAMPLE GUIAS
  // ============================================================================

  // Clean existing guides for re-seed
  await prisma.subSecaoGuia.deleteMany();
  await prisma.secaoGuia.deleteMany();
  await prisma.guia.deleteMany();

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
      conteudo: "# Conceitos Básicos\n\nEste capítulo aborda os fundamentos...",
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
╔════════════════════════════════════════════════════════════════╗
║                      🌱 Seed Complete!                         ║
╠════════════════════════════════════════════════════════════════╣
║  Reference Data:                                               ║
║    - Campus: ${campusI.id.slice(0, 8)}...                                ║
║    - Centro (CI): ${ci.id.slice(0, 8)}...                            ║
║    - Cursos: CC, EC, CDIA, SI, Mat. Comp.                      ║
║                                                                ║
║  Content Data:                                                 ║
║    - Entidades: ${String(entidadeCount).padEnd(3)} (from aquario-entidades)             ║
║    - Guias: 3 example guides with sections                     ║
╚════════════════════════════════════════════════════════════════╝

IDs for testing:
  centroId:  ${ci.id}
  cursoCC:   ${cc.id}
  cursoEC:   ${ec.id}
  cursoCDIA: ${cdia.id}
  cursoSI:   ${si.id}
  cursoMat:  ${mat.id}
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
