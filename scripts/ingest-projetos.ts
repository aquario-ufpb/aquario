/**
 * Ingest project backfill CSVs into the DB.
 *
 * Reads every `data/projetos-backfill*.csv` file, resolves entidade names to
 * IDs, generates slugs, converts the markdown body to HTML, and inserts
 * Projeto + ProjetoAutor rows. Authors in the CSV's `autores` column are
 * already encoded into the body text (as a "Autores: ..." footer) — so we
 * don't link them as ProjetoAutor (they aren't in the user table).
 *
 * Idempotent: skips projects whose generated slug already exists in DB.
 *
 * Usage:
 *   npx tsx scripts/ingest-projetos.ts          # dry-run, prints what would happen
 *   npx tsx scripts/ingest-projetos.ts --apply  # actually inserts
 *   npx tsx scripts/ingest-projetos.ts --file=projetos-backfill-tril.csv [--apply]
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const APPLY = process.argv.includes("--apply");
const FILE_FLAG = process.argv.find(a => a.startsWith("--file="));
const ONLY_FILE = FILE_FLAG ? FILE_FLAG.slice("--file=".length) : null;

const prisma = new PrismaClient();

// --- CSV parser (same as build-tail-backfill) ---
function parseCSV(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let i = 0;
  let inQuotes = false;
  if (input.charCodeAt(0) === 0xfeff) {
    i = 1;
  }
  while (i < input.length) {
    const c = input[i];
    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\n" || c === "\r") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      if (c === "\r" && input[i + 1] === "\n") {
        i += 2;
      } else {
        i++;
      }
      continue;
    }
    field += c;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0].length > 0));
}

function readCSV(filePath: string): Record<string, string>[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const rows = parseCSV(raw);
  if (rows.length === 0) {
    return [];
  }
  const header = rows[0];
  return rows.slice(1).map(r => {
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => {
      obj[h] = r[idx] ?? "";
    });
    return obj;
  });
}

// --- Markdown → HTML (subset that covers our CSV content) ---
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineFormat(text: string): string {
  let result = escapeHtml(text);
  // Bold **text**
  result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic _text_ (avoid matching inside words)
  result = result.replace(/(^|[\s(])_([^_]+)_(?=[\s.,;:!?)]|$)/g, "$1<em>$2</em>");
  // Auto-link URLs
  result = result.replace(
    /(https?:\/\/[^\s<]+[^\s<.,)])/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  return result;
}

function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inBlockquote = false;
  let inList = false;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      const text = inlineFormat(paragraph.join(" "));
      out.push(`<p>${text}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };
  const flushBlockquote = () => {
    if (inBlockquote) {
      out.push("</blockquote>");
      inBlockquote = false;
    }
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");

    if (line === "") {
      flushParagraph();
      flushBlockquote();
      flushList();
      continue;
    }

    if (line === "---") {
      flushParagraph();
      flushBlockquote();
      flushList();
      out.push("<hr>");
      continue;
    }

    const heading = line.match(/^(#{1,6}) (.+)$/);
    if (heading) {
      flushParagraph();
      flushBlockquote();
      flushList();
      const level = heading[1].length;
      out.push(`<h${level}>${inlineFormat(heading[2])}</h${level}>`);
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      if (!inBlockquote) {
        out.push("<blockquote>");
        inBlockquote = true;
      }
      out.push(`<p>${inlineFormat(line.slice(2))}</p>`);
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      flushBlockquote();
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inlineFormat(line.slice(2))}</li>`);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushBlockquote();
  flushList();

  return out.join("\n");
}

// --- Slug ---
function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let suffix = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.projeto.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix++;
  }
  return slug;
}

// --- Main ---
async function main() {
  const dataDir = "data";
  let files = fs
    .readdirSync(dataDir)
    .filter(f => /^projetos-backfill.*\.csv$/.test(f))
    .sort();

  if (ONLY_FILE) {
    files = files.filter(f => f === ONLY_FILE);
    if (files.length === 0) {
      console.error(`File not found: ${ONLY_FILE}`);
      process.exit(1);
    }
  }

  console.log(`Mode: ${APPLY ? "APPLY (writing to DB)" : "DRY-RUN"}`);
  console.log(`Files: ${files.join(", ")}\n`);

  const entidades = await prisma.entidade.findMany({ select: { id: true, nome: true } });
  const entidadeByName = new Map(entidades.map(e => [e.nome.toLowerCase(), e.id]));
  console.log(`Loaded ${entidades.length} entidades from DB`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    console.log(`\n=== ${file} ===`);
    const rows = readCSV(filePath);

    for (const row of rows) {
      const titulo = (row.titulo || "").trim();
      if (!titulo) {
        continue;
      }

      const baseSlug = generateSlug(titulo);
      if (!baseSlug) {
        console.log(`  FAIL "${titulo}": couldn't generate slug`);
        failed++;
        continue;
      }

      // Check existence (idempotency)
      const existing = await prisma.projeto.findUnique({ where: { slug: baseSlug } });
      if (existing) {
        console.log(`  SKIP "${titulo}": already exists (slug=${baseSlug})`);
        skipped++;
        continue;
      }

      // Resolve entidades
      const entidadeNames = (row.entidades || "")
        .split(";")
        .map(n => n.trim())
        .filter(Boolean);
      const entidadeIds: string[] = [];
      const missing: string[] = [];
      for (const name of entidadeNames) {
        const id = entidadeByName.get(name.toLowerCase());
        if (id) {
          entidadeIds.push(id);
        } else {
          missing.push(name);
        }
      }

      if (entidadeIds.length === 0) {
        console.log(
          `  FAIL "${titulo}": no entidades resolved (csv=${entidadeNames.join(",")} missing=${missing.join(",")})`
        );
        failed++;
        continue;
      }
      if (missing.length > 0) {
        console.log(`  WARN "${titulo}": missing entidades dropped: ${missing.join(", ")}`);
      }

      const tags = (row.tags || "")
        .split(";")
        .map(t => t.trim())
        .filter(Boolean);

      const slug = APPLY ? await uniqueSlug(baseSlug) : baseSlug;
      const html = row.text ? markdownToHtml(row.text) : null;

      console.log(
        `  ${APPLY ? "CREATE" : "WOULD CREATE"} "${titulo}" → slug=${slug}, entidades=${entidadeIds.length}, tags=${tags.length}`
      );

      if (APPLY) {
        await prisma.projeto.create({
          data: {
            titulo,
            slug,
            subtitulo: row.subtitulo || null,
            textContent: html,
            urlImagem: row.urlImagem || null,
            urlRepositorio: row.urlRepo || null,
            urlDemo: row.urlDemo || null,
            urlOutro: row.urlOutro || null,
            tags,
            status: "PUBLICADO",
            publicadoEm: new Date(),
            autores: {
              create: entidadeIds.map((entidadeId, idx) => ({
                entidadeId,
                autorPrincipal: idx === 0,
              })),
            },
          },
        });
        created++;
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Created: ${created}`);
  console.log(`Skipped (already exists): ${skipped}`);
  console.log(`Failed (missing entidades / invalid): ${failed}`);

  await prisma.$disconnect();
}

main().catch(async e => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
