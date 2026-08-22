import { readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const sigaaModels = [...schema.matchAll(/model (Sigaa\w+) \{([\s\S]*?)\n\}/g)];
const forbiddenField =
  /password|senha|username|cookie|html|pdf|viewstate|raw(?:body|error|response)|requestbody|responsebody|bearer/i;

if (sigaaModels.length !== 4) {
  throw new Error(`Expected four SIGAA persistence models, found ${sigaaModels.length}.`);
}

for (const [, modelName, body] of sigaaModels) {
  const fields = body
    .split("\n")
    .map(line => line.trim().split(/\s+/)[0])
    .filter(field => field && !field.startsWith("@@") && !field.startsWith("//"));
  const forbidden = fields.find(field => forbiddenField.test(field));
  if (forbidden) {
    throw new Error(`${modelName}.${forbidden} violates the SIGAA persistence boundary.`);
  }
  if (/DisciplinaConcluida|DisciplinaSemestre/.test(body)) {
    throw new Error(`${modelName} must not own manual academic rows.`);
  }
}

const jsonFields = sigaaModels.flatMap(([, modelName, body]) =>
  body
    .split("\n")
    .filter(line => /\sJson\??(?:\s|$)/.test(line))
    .map(line => `${modelName}.${line.trim().split(/\s+/)[0]}`)
);
if (jsonFields.join(",") !== "SigaaAcademicSnapshot.payload") {
  throw new Error(`Unexpected SIGAA JSON fields: ${jsonFields.join(", ") || "none"}.`);
}

if (!/matriculaOrigem\s+MatriculaOrigem\?/.test(schema)) {
  throw new Error("Usuario.matriculaOrigem is required by the SIGAA provenance boundary.");
}

function sourceFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return [".ts", ".tsx"].includes(extname(entry.name)) ? [path] : [];
  });
}

for (const root of ["src/lib/client", "src/lib/shared", "src/components"]) {
  for (const path of sourceFiles(root)) {
    const source = readFileSync(path, "utf8");
    if (/from ["']@\/lib\/server\/(?:services\/sigaa|db\/interfaces\/sigaa)/.test(source)) {
      throw new Error(`${path} imports the server-only SIGAA persistence boundary.`);
    }
  }
}

console.log("SIGAA persistence boundary verified.");
