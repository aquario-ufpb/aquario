/**
 * Production Import Script
 *
 * Upserts reference data (Campus, Centro, Cursos) and imports content data
 * (entidades, curriculos) into whichever database is configured in DATABASE_URL.
 *
 * Usage:
 *   1. Set DATABASE_URL in .env to the target database
 *   2. Run: npm run db:import-prod
 *   3. Restore your local DATABASE_URL
 *
 * This script is SAFE to re-run — it uses upserts for reference data and
 * rebuilds curriculo data from source CSVs.
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

type TipoEntidade =
  | "LABORATORIO"
  | "GRUPO"
  | "LIGA_ACADEMICA"
  | "EMPRESA"
  | "ATLETICA"
  | "CENTRO_ACADEMICO"
  | "OUTRO";

type NaturezaDisciplina = "OBRIGATORIA" | "OPTATIVA" | "COMPLEMENTAR_FLEXIVA";

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

// ============================================================================
// MAPPINGS
// ============================================================================

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

const courseNameMapping: Record<string, string> = {
  "CIÊNCIA DA COMPUTAÇÃO": "Ciência da Computação",
  "ENGENHARIA DA COMPUTAÇÃO": "Engenharia da Computação",
  "CIÊNCIA DE DADOS E INTELIGÊNCIA ARTIFICIAL": "Ciência de Dados e Inteligência Artificial",
  "ENGENHARIA DE ROBÔS": "Engenharia de Robôs",
};

// ============================================================================
// UTILITIES
// ============================================================================

function convertImagePathToUrl(imagePath: string | undefined): string | null {
  if (!imagePath) return null;

  const normalized = imagePath.replace(/^\.\//, "");
  if (normalized.startsWith("assets/")) {
    return `/api/content-images/entidades/${normalized}`;
  }
  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("/")
  ) {
    return imagePath;
  }
  return `/api/content-images/entidades/assets/${normalized}`;
}

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

function parseCsv(content: string): CsvRow[] {
  const lines = content.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
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

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}

// ============================================================================
// IMPORT FUNCTIONS
// ============================================================================

async function importReferenceData() {
  console.log("\n📦 Importing reference data...");

  const campusI = await prisma.campus.upsert({
    where: { nome: "Campus I - João Pessoa" },
    update: {},
    create: { nome: "Campus I - João Pessoa" },
  });
  console.log("  ✅ Campus: Campus I - João Pessoa");

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
  console.log("  ✅ Centro: CI - Centro de Informática");

  const cursos = {
    "Ciência da Computação": await prisma.curso.upsert({
      where: { nome: "Ciência da Computação" },
      update: {},
      create: { nome: "Ciência da Computação", centroId: ci.id },
    }),
    "Engenharia da Computação": await prisma.curso.upsert({
      where: { nome: "Engenharia da Computação" },
      update: {},
      create: { nome: "Engenharia da Computação", centroId: ci.id },
    }),
    "Ciência de Dados e Inteligência Artificial": await prisma.curso.upsert({
      where: { nome: "Ciência de Dados e Inteligência Artificial" },
      update: {},
      create: { nome: "Ciência de Dados e Inteligência Artificial", centroId: ci.id },
    }),
    "Engenharia de Robôs": await prisma.curso.upsert({
      where: { nome: "Engenharia de Robôs" },
      update: {},
      create: { nome: "Engenharia de Robôs", centroId: ci.id },
    }),
  };
  console.log("  ✅ Cursos: CC, EC, CDIA, ER");

  const cursoMap: Record<string, string> = {};
  for (const [name, curso] of Object.entries(cursos)) {
    cursoMap[name] = curso.id;
  }

  return { centroId: ci.id, cursoMap };
}

async function importEntidades(centroId: string): Promise<number> {
  console.log("\n🏢 Importing entidades...");

  const entidadesDir = path.join(process.cwd(), "content/aquario-entidades/centro-de-informatica");
  if (!fs.existsSync(entidadesDir)) {
    console.log("  ⚠️  content/aquario-entidades not found, skipping");
    return 0;
  }

  const files = fs.readdirSync(entidadesDir).filter((f) => f.endsWith(".json"));
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

  console.log(`  ✅ ${count} entidades imported`);
  return count;
}

async function importCurriculos(
  cursoMap: Record<string, string>
): Promise<{ curriculos: number; disciplinas: number; prereqs: number }> {
  console.log("\n📚 Importing curriculos...");

  const curriculosDir = path.join(process.cwd(), "content/aquario-curriculos");
  if (!fs.existsSync(curriculosDir)) {
    console.log("  ⚠️  content/aquario-curriculos not found, skipping");
    return { curriculos: 0, disciplinas: 0, prereqs: 0 };
  }

  // Clean existing curriculo data (rebuilds from source CSVs)
  await prisma.preRequisitoDisciplina.deleteMany();
  await prisma.equivalencia.deleteMany();
  await prisma.curriculoDisciplina.deleteMany();
  await prisma.curriculo.deleteMany();
  console.log("  🗑️  Cleared existing curriculo data");

  const files = fs.readdirSync(curriculosDir).filter((f) => f.endsWith(".csv"));
  if (files.length === 0) {
    console.log("  ⚠️  No CSV files found, skipping");
    return { curriculos: 0, disciplinas: 0, prereqs: 0 };
  }

  // Parse all CSVs
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

  // Step 2: Group rows by curriculo
  const curriculoGroups = new Map<string, CsvRow[]>();
  for (const row of allRows) {
    const key = `${row.course_name}|${row.curriculum_code}`;
    if (!curriculoGroups.has(key)) curriculoGroups.set(key, []);
    curriculoGroups.get(key)!.push(row);
  }

  let curriculoCount = 0;
  let prereqCount = 0;

  // Step 3: Create Curriculos + CurriculoDisciplinas + PreRequisitos
  for (const [key, rows] of curriculoGroups) {
    const [courseName, curriculumCode] = key.split("|");
    const dbCourseName = courseNameMapping[courseName];
    if (!dbCourseName) {
      console.log(`  ⚠️  Unknown course: ${courseName}, skipping`);
      continue;
    }
    const cursoId = cursoMap[dbCourseName];
    if (!cursoId) {
      console.log(`  ⚠️  Curso not found: ${dbCourseName}, skipping`);
      continue;
    }

    const curriculo = await prisma.curriculo.create({
      data: { codigo: curriculumCode, ativo: true, cursoId },
    });
    curriculoCount++;

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

    for (const row of rows) {
      if (!row.prerequisites?.trim()) continue;
      const cdId = cdIdByDisciplinaCode.get(row.discipline_code);
      if (!cdId) continue;

      const prereqCodes = row.prerequisites
        .split(";")
        .map((c) => c.trim())
        .filter(Boolean);

      for (const prereqCode of prereqCodes) {
        let prereqDisciplinaId = disciplinaIdByCode.get(prereqCode);
        if (!prereqDisciplinaId) {
          const stub = await prisma.disciplina.upsert({
            where: { codigo: prereqCode },
            update: {},
            create: { codigo: prereqCode, nome: prereqCode },
          });
          disciplinaIdByCode.set(prereqCode, stub.id);
          prereqDisciplinaId = stub.id;
        }
        await prisma.preRequisitoDisciplina.create({
          data: { curriculoDisciplinaId: cdId, disciplinaRequeridaId: prereqDisciplinaId },
        });
        prereqCount++;
      }
    }
  }

  console.log(
    `  ✅ ${curriculoCount} curriculos, ${seenDisciplinas.size} disciplinas, ${prereqCount} prerequisites`
  );
  return { curriculos: curriculoCount, disciplinas: seenDisciplinas.size, prereqs: prereqCount };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const dbUrl = process.env.DATABASE_URL || "";
  const isLocal = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");

  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║         🚀 Production Import Script                 ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`\nTarget: ${isLocal ? "LOCAL" : "REMOTE"} database`);
  console.log(`URL: ${dbUrl.replace(/\/\/.*@/, "//***@")}`);

  if (!isLocal) {
    const ok = await confirm("\n⚠️  This is a REMOTE database. Continue?");
    if (!ok) {
      console.log("Aborted.");
      process.exit(0);
    }
  }

  const { centroId, cursoMap } = await importReferenceData();
  await importEntidades(centroId);
  await importCurriculos(cursoMap);

  console.log("\n✅ Import complete!\n");
}

main()
  .catch((e) => {
    console.error("❌ Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
