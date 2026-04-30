import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize project body HTML at write time. Defense in depth — the detail page
 * already DOMPurify's on render, but storing pre-sanitized HTML means any
 * future consumer (RSS digest, SSR meta, admin tooling, etc.) is safe even if
 * it forgets to sanitize. Allowed tags/attrs match what the Tiptap editor can
 * actually emit (paragraphs, headings, lists, formatting, links, images).
 */
function sanitizeProjetoHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "code",
      "pre",
      "blockquote",
      "h1",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "a",
      "img",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "title"],
    // Belt-and-suspenders — the schema also blocks these in URL fields, but
    // DOMPurify's URL filter is the actual enforcement here for embedded links.
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/)/i,
  });
}

/**
 * Accepts either an absolute URL or a server-relative path (starting with "/").
 * Used for `urlImagem` because the blob storage backend returns absolute URLs in
 * production (Vercel Blob) but relative paths in local dev.
 */
const internalUrlSchema = z.string().refine(v => v.startsWith("/") || /^https?:\/\//i.test(v), {
  message: "Deve ser uma URL absoluta ou caminho começando com /",
});

/**
 * URL whitelist for user-provided project links — http(s) only.
 * z.string().url() alone accepts `javascript:`, `data:`, etc. which become XSS
 * vectors when rendered as <a href={...}>.
 */
const httpUrlSchema = z
  .string()
  .url()
  .refine(v => /^https?:\/\//i.test(v), {
    message: "Apenas URLs http(s) são permitidas",
  });

/**
 * Um autor de projeto referencia um usuario, uma entidade, ou ambos.
 * Pelo menos um dos dois ids precisa estar presente.
 */
export const projetoAutorSchema = z
  .object({
    usuarioId: z.string().uuid("ID de usuário inválido").optional().nullable(),
    entidadeId: z.string().uuid("ID de entidade inválido").optional().nullable(),
    autorPrincipal: z.boolean().default(false),
  })
  .refine(a => !!a.usuarioId || !!a.entidadeId, {
    message: "Cada autor deve referenciar um usuário ou uma entidade",
    path: ["usuarioId"],
  });

const createProjetoBaseSchema = z.object({
  titulo: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  subtitulo: z.string().max(500).optional().nullable(),
  // Sanitize at write time — the detail page already sanitizes on render, but
  // storing safe HTML means future renderers (RSS digest, SSR meta, admin
  // tooling) can't accidentally reintroduce stored XSS. Run sanitize first,
  // then enforce the length cap on the cleaned output.
  textContent: z
    .string()
    .optional()
    .nullable()
    .transform(v => (v == null ? v : sanitizeProjetoHtml(v)))
    .refine(v => v == null || v.length <= 50000, {
      message: "Conteúdo excede o limite de 50.000 caracteres",
    }),
  urlImagem: internalUrlSchema.optional().nullable(),
  status: z.enum(["RASCUNHO", "PUBLICADO", "ARQUIVADO"]).default("RASCUNHO"),
  // Normalize tags to lowercase + trimmed at validation time so search and
  // dedup are trivially consistent. Drop empties so a trailing comma in the
  // input field doesn't create a "" tag.
  tags: z
    .array(z.string().max(50))
    .default([])
    .transform(arr => Array.from(new Set(arr.map(t => t.trim().toLowerCase()).filter(Boolean)))),
  dataInicio: z.coerce.date().optional().nullable(),
  dataFim: z.coerce.date().optional().nullable(),
  urlRepositorio: httpUrlSchema.optional().nullable(),
  urlDemo: httpUrlSchema.optional().nullable(),
  urlOutro: httpUrlSchema.optional().nullable(),
  autores: z.array(projetoAutorSchema).min(1),
});

export const createProjetoSchema = createProjetoBaseSchema
  .refine(
    data => {
      if (data.dataInicio && data.dataFim) {
        return data.dataFim >= data.dataInicio;
      }
      return true;
    },
    {
      message: "Data de fim deve ser posterior à data de início",
      path: ["dataFim"],
    }
  )
  .refine(data => data.autores.filter(a => a.autorPrincipal).length === 1, {
    message: "Exatamente um autor deve ser marcado como principal",
    path: ["autores"],
  });

export const updateProjetoSchema = createProjetoBaseSchema
  .partial()
  .omit({ autores: true })
  .refine(
    data => {
      if (data.dataInicio && data.dataFim) {
        return data.dataFim >= data.dataInicio;
      }
      return true;
    },
    {
      message: "Data de fim deve ser posterior à data de início",
      path: ["dataFim"],
    }
  );

export const updateProjetoAutoresSchema = z
  .object({
    autores: z.array(projetoAutorSchema).min(1, "Pelo menos um autor é obrigatório"),
  })
  .refine(data => data.autores.filter(a => a.autorPrincipal).length === 1, {
    message: "Exatamente um autor deve ser marcado como principal",
    path: ["autores"],
  });

export const listProjetosSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  /**
   * Defaults to PUBLICADO on the list endpoint to keep public listings safe.
   * Non-public statuses require authentication and are filtered server-side
   * to projects the caller is authorized to see.
   */
  status: z.enum(["RASCUNHO", "PUBLICADO", "ARQUIVADO"]).default("PUBLICADO"),
  entidadeId: z.string().uuid().optional(),
  usuarioId: z.string().uuid().optional(),
  tags: z.string().optional(),
  search: z.string().optional(),
  tipoEntidade: z
    .enum([
      "PESSOAL",
      "LABORATORIO",
      "GRUPO",
      "LIGA_ACADEMICA",
      "EMPRESA",
      "ATLETICA",
      "CENTRO_ACADEMICO",
      "OUTRO",
    ])
    .optional(),
  orderBy: z.enum(["criadoEm", "publicadoEm", "titulo", "autoresCount"]).default("criadoEm"),
  order: z.enum(["asc", "desc"]).default("desc"),
  /**
   * When true, restrict results to projects the caller authors or admins —
   * for any status. Lets the same listing endpoint power "Meus publicados"
   * without changing status semantics for master admins.
   *
   * Parsed strictly: only the literal "true" enables it. Avoids `z.coerce.boolean`
   * which would treat "false" (a non-empty string) as truthy.
   */
  scopedToMe: z
    .enum(["true", "false"])
    .optional()
    .transform(v => v === "true"),
});

export type ProjetoAutorInput = z.infer<typeof projetoAutorSchema>;
export type CreateProjetoInput = z.infer<typeof createProjetoSchema>;
export type UpdateProjetoInput = z.infer<typeof updateProjetoSchema>;
export type UpdateProjetoAutoresInput = z.infer<typeof updateProjetoAutoresSchema>;
export type ListProjetosInput = z.infer<typeof listProjetosSchema>;
