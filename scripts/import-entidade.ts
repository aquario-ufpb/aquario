/**
 * Import a single entidade (create-only)
 *
 * Creates ONE entidade from its JSON file in the content/aquario-entidades
 * submodule, if it doesn't exist yet. It never updates or deletes anything —
 * unlike scripts/import-production.ts, which upserts every entidade (wiping
 * any edits made in production) and rebuilds curriculos.
 *
 * Usage:
 *   tsx scripts/import-entidade.ts <centro-folder>/<file>.json [--apply]
 *
 * Without --apply it only prints what it would do (dry run).
 * Exits 0 if the entidade already exists (nothing to do).
 */

import { PrismaClient, type TipoEntidade } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

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
  founding_date?: string;
  foundingDate?: string;
};

// Same mapping and helpers as scripts/import-production.ts, so an entidade
// created here is indistinguishable from one created by the full import.
const TIPO_MAPPING: Record<string, TipoEntidade> = {
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

// Submodule folder -> Centro sigla. Centros are reference data and are never
// created here; an unknown folder is an error.
const FOLDER_TO_CENTRO_SIGLA: Record<string, string> = {
  "centro-de-informatica": "CI",
};

const FILE_ARG_PATTERN = /^[a-z0-9-]+\/[a-z0-9-]+\.json$/;

function nomeToSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function convertImagePathToUrl(imagePath: string | undefined): string | null {
  if (!imagePath) {
    return null;
  }
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
  return null;
}

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const fileArg = args.find(a => !a.startsWith("--"));

  if (!fileArg || !FILE_ARG_PATTERN.test(fileArg)) {
    fail(
      `Expected "<centro-folder>/<file>.json" (e.g. centro-de-informatica/sail.json), got: ${fileArg ?? "(none)"}`
    );
  }

  const [folder] = fileArg.split("/");
  const centroSigla = FOLDER_TO_CENTRO_SIGLA[folder];
  if (!centroSigla) {
    fail(
      `Unknown centro folder "${folder}". Known: ${Object.keys(FOLDER_TO_CENTRO_SIGLA).join(", ")}`
    );
  }

  const entidadesRoot = path.join(process.cwd(), "content/aquario-entidades");
  const filePath = path.join(entidadesRoot, fileArg);
  if (!fs.existsSync(filePath)) {
    fail(`File not found: content/aquario-entidades/${fileArg} (is the submodule checked out?)`);
  }

  const data: EntidadeJson = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  if (!data.name?.trim()) {
    fail("JSON is missing `name`");
  }
  const tipo = TIPO_MAPPING[data.tipo];
  if (!tipo) {
    fail(`Unknown tipo "${data.tipo}". Valid: ${Object.keys(TIPO_MAPPING).join(", ")}`);
  }

  const urlFoto = convertImagePathToUrl(data.imagePath);
  if (data.imagePath?.replace(/^\.\//, "").startsWith("assets/")) {
    const assetPath = path.join(entidadesRoot, folder, data.imagePath.replace(/^\.\//, ""));
    if (!fs.existsSync(assetPath)) {
      fail(`imagePath points to a missing file: ${data.imagePath}`);
    }
  }

  const foundingDate = data.founding_date || data.foundingDate;
  const record = {
    nome: data.name,
    slug: nomeToSlug(data.name),
    subtitle: data.subtitle || null,
    descricao: data.description || null,
    tipo,
    urlFoto,
    contato: data.contato_email || null,
    instagram: data.instagram || null,
    linkedin: data.linkedin || null,
    website: data.website || null,
    location: data.location || null,
    foundingDate: foundingDate ? new Date(foundingDate) : null,
  };

  const prisma = new PrismaClient();
  try {
    const centro = await prisma.centro.findUnique({ where: { sigla: centroSigla } });
    if (!centro) {
      fail(`Centro with sigla "${centroSigla}" not found in the database`);
    }

    const existing = await prisma.entidade.findUnique({
      where: { nome_tipo: { nome: record.nome, tipo: record.tipo } },
      select: { id: true, slug: true },
    });
    if (existing) {
      console.log(
        `ℹ️  "${record.nome}" (${record.tipo}) already exists (slug: ${existing.slug}). Nothing to do — this script never updates.`
      );
      return;
    }

    const slugTaken = await prisma.entidade.findUnique({
      where: { slug: record.slug },
      select: { nome: true },
    });
    if (slugTaken) {
      fail(`Slug "${record.slug}" is already used by "${slugTaken.nome}"`);
    }

    console.log(`📄 ${fileArg} -> entidade to create:`);
    console.log(JSON.stringify({ ...record, centro: centroSigla }, null, 2));

    if (!apply) {
      console.log("\n🔎 Dry run — nothing written. Re-run with --apply to create it.");
      return;
    }

    const created = await prisma.entidade.create({
      data: { ...record, centroId: centro.id },
      select: { id: true, slug: true },
    });
    console.log(
      `\n✅ Created "${record.nome}" (id: ${created.id}) — page: /entidade/${created.slug}`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
