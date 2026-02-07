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

type NaturezaDisciplina = "OBRIGATORIA" | "OPTATIVA" | "COMPLEMENTAR_FLEXIVA";

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

const naturezaMapping: Record<string, NaturezaDisciplina> = {
  Obrigatória: "OBRIGATORIA",
  Optativa: "OPTATIVA",
  "Complementar Flexiva": "COMPLEMENTAR_FLEXIVA",
};

// Map CSV course names to DB curso names
const courseNameMapping: Record<string, string> = {
  "CIÊNCIA DA COMPUTAÇÃO": "Ciência da Computação",
  "ENGENHARIA DA COMPUTAÇÃO": "Engenharia da Computação",
  "CIÊNCIA DE DADOS E INTELIGÊNCIA ARTIFICIAL": "Ciência de Dados e Inteligência Artificial",
  "ENGENHARIA DE ROBÔS": "Engenharia de Robôs",
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

type CsvRow = {
  course_name: string;
  curriculum_code: string;
  discipline_code: string;
  discipline_name: string;
  period: string;
  type: string;
  workload_total: string;
  theory_hours: string;
  practice_hours: string;
  department: string;
  modality: string;
  prerequisites: string;
  equivalences: string;
  syllabus: string;
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

/**
 * Generate a URL-friendly slug from a name
 */
function nomeToSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Parse a CSV line handling quoted fields with commas inside
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Parse CSV file content into typed rows
 */
function parseCsv(content: string): CsvRow[] {
  const lines = content.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(h => h.trim());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] || "").trim();
    }
    rows.push(row as unknown as CsvRow);
  }

  return rows;
}

function parsePeriod(period: string): number {
  const match = period.match(/^(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function parseIntOrNull(value: string): number | null {
  const n = parseInt(value);
  return isNaN(n) ? null : n;
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
      const slug = nomeToSlug(data.name);

      await prisma.entidade.upsert({
        where: { nome_tipo: { nome: data.name, tipo } },
        update: {
          slug,
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
          slug,
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

async function loadCurriculosFromContent(
  cursoMap: Record<string, string>
): Promise<{ curriculos: number; disciplinas: number; prereqs: number; equivs: number }> {
  const curriculosDir = path.join(process.cwd(), "content/aquario-curriculos");

  if (!fs.existsSync(curriculosDir)) {
    console.log("⚠️  Content aquario-curriculos not found, skipping...");
    return { curriculos: 0, disciplinas: 0, prereqs: 0, equivs: 0 };
  }

  // Clean existing curriculo data (order matters for FK constraints)
  await prisma.preRequisitoDisciplina.deleteMany();
  await prisma.equivalencia.deleteMany();
  await prisma.curriculoDisciplina.deleteMany();
  await prisma.curriculo.deleteMany();

  const files = fs.readdirSync(curriculosDir).filter(f => f.endsWith(".csv"));
  if (files.length === 0) {
    console.log("⚠️  No CSV files found in aquario-curriculos, skipping...");
    return { curriculos: 0, disciplinas: 0, prereqs: 0, equivs: 0 };
  }

  // Parse all CSVs and collect all rows
  const allRows: CsvRow[] = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(curriculosDir, file), "utf-8");
    allRows.push(...parseCsv(content));
  }

  // Step 1: Upsert all unique Disciplinas
  const seenDisciplinas = new Set<string>();
  const disciplinaIdByCode = new Map<string, string>();

  for (const row of allRows) {
    if (seenDisciplinas.has(row.discipline_code)) continue;
    seenDisciplinas.add(row.discipline_code);

    const disciplina = await prisma.disciplina.upsert({
      where: { codigo: row.discipline_code },
      update: {
        nome: row.discipline_name,
        cargaHorariaTotal: parseIntOrNull(row.workload_total),
        cargaHorariaTeoria: parseIntOrNull(row.theory_hours),
        cargaHorariaPratica: parseIntOrNull(row.practice_hours),
        departamento: row.department || null,
        modalidade: row.modality || null,
        ementa: row.syllabus || null,
      },
      create: {
        codigo: row.discipline_code,
        nome: row.discipline_name,
        cargaHorariaTotal: parseIntOrNull(row.workload_total),
        cargaHorariaTeoria: parseIntOrNull(row.theory_hours),
        cargaHorariaPratica: parseIntOrNull(row.practice_hours),
        departamento: row.department || null,
        modalidade: row.modality || null,
        ementa: row.syllabus || null,
      },
    });
    disciplinaIdByCode.set(row.discipline_code, disciplina.id);
  }

  // Step 2: Group rows by curriculo (course + code)
  const curriculoGroups = new Map<string, CsvRow[]>();
  for (const row of allRows) {
    const key = `${row.course_name}|${row.curriculum_code}`;
    if (!curriculoGroups.has(key)) curriculoGroups.set(key, []);
    curriculoGroups.get(key)!.push(row);
  }

  let curriculoCount = 0;
  let prereqCount = 0;
  let equivCount = 0;

  // Step 3: Create Curriculos + CurriculoDisciplinas
  for (const [key, rows] of curriculoGroups) {
    const [courseName, curriculumCode] = key.split("|");
    const dbCourseName = courseNameMapping[courseName];
    if (!dbCourseName) {
      console.log(`  ⚠️  Unknown course: ${courseName}, skipping...`);
      continue;
    }
    const cursoId = cursoMap[dbCourseName];
    if (!cursoId) {
      console.log(`  ⚠️  Curso not found in DB: ${dbCourseName}, skipping...`);
      continue;
    }

    const curriculo = await prisma.curriculo.create({
      data: {
        codigo: curriculumCode,
        ativo: true, // Each CSV represents the current/active curriculo
        cursoId,
      },
    });
    curriculoCount++;

    // Create CurriculoDisciplina entries
    const cdIdByDisciplinaCode = new Map<string, string>();

    for (const row of rows) {
      const disciplinaId = disciplinaIdByCode.get(row.discipline_code);
      if (!disciplinaId) continue;

      const natureza = naturezaMapping[row.type] || "OPTATIVA";

      const cd = await prisma.curriculoDisciplina.create({
        data: {
          curriculoId: curriculo.id,
          disciplinaId,
          natureza,
          periodo: parsePeriod(row.period),
        },
      });
      cdIdByDisciplinaCode.set(row.discipline_code, cd.id);
    }

    // Step 4: Create PreRequisitoDisciplina entries
    for (const row of rows) {
      if (!row.prerequisites?.trim()) continue;

      const cdId = cdIdByDisciplinaCode.get(row.discipline_code);
      if (!cdId) continue;

      const prereqCodes = row.prerequisites
        .split(";")
        .map(c => c.trim())
        .filter(Boolean);

      for (const prereqCode of prereqCodes) {
        const prereqDisciplinaId = disciplinaIdByCode.get(prereqCode);
        if (!prereqDisciplinaId) {
          // Prerequisite discipline not in our data — create a stub
          const stub = await prisma.disciplina.upsert({
            where: { codigo: prereqCode },
            update: {},
            create: { codigo: prereqCode, nome: prereqCode },
          });
          disciplinaIdByCode.set(prereqCode, stub.id);

          await prisma.preRequisitoDisciplina.create({
            data: { curriculoDisciplinaId: cdId, disciplinaRequeridaId: stub.id },
          });
        } else {
          await prisma.preRequisitoDisciplina.create({
            data: { curriculoDisciplinaId: cdId, disciplinaRequeridaId: prereqDisciplinaId },
          });
        }
        prereqCount++;
      }
    }

    // Step 5: Create Equivalencia entries
    for (const row of rows) {
      if (!row.equivalences?.trim()) continue;

      const disciplinaId = disciplinaIdByCode.get(row.discipline_code);
      if (!disciplinaId) continue;

      const equivCodes = row.equivalences
        .split(";")
        .map(c => c.trim())
        .filter(Boolean);

      for (const equivCode of equivCodes) {
        let equivDisciplinaId = disciplinaIdByCode.get(equivCode);
        if (!equivDisciplinaId) {
          const stub = await prisma.disciplina.upsert({
            where: { codigo: equivCode },
            update: {},
            create: { codigo: equivCode, nome: equivCode },
          });
          disciplinaIdByCode.set(equivCode, stub.id);
          equivDisciplinaId = stub.id;
        }

        await prisma.equivalencia.upsert({
          where: {
            disciplinaOrigemId_disciplinaEquivalenteId: {
              disciplinaOrigemId: disciplinaId,
              disciplinaEquivalenteId: equivDisciplinaId,
            },
          },
          update: {},
          create: {
            disciplinaOrigemId: disciplinaId,
            disciplinaEquivalenteId: equivDisciplinaId,
          },
        });
        equivCount++;
      }
    }
  }

  return {
    curriculos: curriculoCount,
    disciplinas: seenDisciplinas.size,
    prereqs: prereqCount,
    equivs: equivCount,
  };
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

  const er = await prisma.curso.upsert({
    where: { nome: "Engenharia de Robôs" },
    update: {},
    create: { nome: "Engenharia de Robôs", centroId: ci.id },
  });

  console.log("✅ Cursos created (CC, EC, CDIA, ER)");

  const cursoMap: Record<string, string> = {
    "Ciência da Computação": cc.id,
    "Engenharia da Computação": ec.id,
    "Ciência de Dados e Inteligência Artificial": cdia.id,
    "Engenharia de Robôs": er.id,
  };

  // ============================================================================
  // ENTIDADES (from aquario-entidades submodule)
  // ============================================================================

  const entidadeCount = await loadEntidadesFromSubmodule(ci.id);
  console.log(`✅ Entidades loaded from submodule: ${entidadeCount}`);

  // ============================================================================
  // CURRICULOS & DISCIPLINAS (from aquario-curriculos content)
  // ============================================================================

  const curriculoStats = await loadCurriculosFromContent(cursoMap);
  console.log(
    `✅ Curriculos loaded: ${curriculoStats.curriculos} curriculos, ` +
      `${curriculoStats.disciplinas} disciplinas, ${curriculoStats.prereqs} prerequisites, ${curriculoStats.equivs} equivalences`
  );

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
║    - Cursos: CC, EC, CDIA, ER                                  ║
║                                                                ║
║  Content Data:                                                 ║
║    - Entidades: ${String(entidadeCount).padEnd(3)} (from aquario-entidades)             ║
║    - Guias: 3 example guides with sections                     ║
║    - Curriculos: ${String(curriculoStats.curriculos).padEnd(2)} (${curriculoStats.disciplinas} disc, ${curriculoStats.prereqs} prereqs, ${curriculoStats.equivs} equivs) ║
╚════════════════════════════════════════════════════════════════╝

IDs for testing:
  centroId:  ${ci.id}
  cursoCC:   ${cc.id}
  cursoEC:   ${ec.id}
  cursoCDIA: ${cdia.id}
  cursoER:   ${er.id}
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
