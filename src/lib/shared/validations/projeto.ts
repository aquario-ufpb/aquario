import { z } from "zod";

/**
 * Accepts either an absolute URL or a server-relative path (starting with "/").
 * Used for `urlImagem` because the blob storage backend returns absolute URLs in
 * production (Vercel Blob) but relative paths in local dev.
 */
const internalUrlSchema = z.string().refine(v => v.startsWith("/") || /^https?:\/\//i.test(v), {
  message: "Deve ser uma URL absoluta ou caminho começando com /",
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
  textContent: z.string().max(50000).optional().nullable(),
  urlImagem: internalUrlSchema.optional().nullable(),
  status: z.enum(["RASCUNHO", "PUBLICADO", "ARQUIVADO"]).default("RASCUNHO"),
  tags: z.array(z.string().max(50)).default([]),
  dataInicio: z.coerce.date().optional().nullable(),
  dataFim: z.coerce.date().optional().nullable(),
  urlRepositorio: z.string().url().optional().nullable(),
  urlDemo: z.string().url().optional().nullable(),
  urlOutro: z.string().url().optional().nullable(),
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
  .refine(data => data.autores.some(a => a.autorPrincipal), {
    message: "Pelo menos um autor deve ser principal",
    path: ["autores"],
  });

export const updateProjetoSchema = createProjetoBaseSchema.partial().omit({ autores: true });

export const updateProjetoAutoresSchema = z
  .object({
    autores: z.array(projetoAutorSchema).min(1, "Pelo menos um autor é obrigatório"),
  })
  .refine(data => data.autores.some(a => a.autorPrincipal), {
    message: "Pelo menos um autor deve ser marcado como principal",
    path: ["autores"],
  });

export const publishProjetoSchema = z.object({
  id: z.string().uuid("ID de projeto inválido"),
});

export const listProjetosSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.enum(["RASCUNHO", "PUBLICADO", "ARQUIVADO"]).optional(),
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
  orderBy: z.enum(["criadoEm", "publicadoEm", "titulo"]).default("criadoEm"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type ProjetoAutorInput = z.infer<typeof projetoAutorSchema>;
export type CreateProjetoInput = z.infer<typeof createProjetoSchema>;
export type UpdateProjetoInput = z.infer<typeof updateProjetoSchema>;
export type UpdateProjetoAutoresInput = z.infer<typeof updateProjetoAutoresSchema>;
export type PublishProjetoInput = z.infer<typeof publishProjetoSchema>;
export type ListProjetosInput = z.infer<typeof listProjetosSchema>;
