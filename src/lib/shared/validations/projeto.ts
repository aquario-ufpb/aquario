import { z } from "zod";
import { StatusProjeto, TipoConteudo } from "@prisma/client";

/**
 * Schema de validação para autor do projeto
 * Apenas autores internos (usuários do sistema)
 */
export const projetoAutorSchema = z.object({
  usuarioId: z.string().uuid("ID de usuário inválido"),
  autorPrincipal: z.boolean().default(false),
});

/**
 * Schema de validação para criação de projeto
 */
const createProjetoBaseSchema = z.object({
  titulo: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  subtitulo: z.string().max(500).optional().nullable(),
  descricao: z.string().max(1000).optional().nullable(),
  textContent: z.string().optional().nullable(),
  tipoConteudo: z.nativeEnum(TipoConteudo).default(TipoConteudo.MARKDOWN),
  urlImagem: z.string().url().optional().nullable(),
  status: z.nativeEnum(StatusProjeto).default(StatusProjeto.RASCUNHO),
  tags: z.array(z.string().max(50)).default([]),
  dataInicio: z.coerce.date().optional().nullable(),
  dataFim: z.coerce.date().optional().nullable(),
  urlRepositorio: z.string().url().optional().nullable(),
  urlDemo: z.string().url().optional().nullable(),
  urlPublicacao: z.string().url().optional().nullable(),
  entidadeId: z.string().uuid().optional().nullable(),
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
  .refine(
    data => {
      return data.autores.some(a => a.autorPrincipal);
    },
    {
      message: "Pelo menos um autor deve ser principal",
      path: ["autores"],
    }
  );

/**
 * Schema de validação para atualização de projeto
 */
export const updateProjetoSchema = createProjetoBaseSchema.partial().omit({ autores: true });

/**
 * Schema de validação para adicionar/atualizar autores de um projeto
 */
export const updateProjetoAutoresSchema = z
  .object({
    autores: z.array(projetoAutorSchema).min(1, "Pelo menos um autor é obrigatório"),
  })
  .refine(
    (data: { autores: Array<{ autorPrincipal: boolean }> }) => {
      const temAutorPrincipal = data.autores.some(
        (a: { autorPrincipal: boolean }) => a.autorPrincipal
      );
      return temAutorPrincipal;
    },
    {
      message: "Pelo menos um autor deve ser marcado como principal",
      path: ["autores"],
    }
  );

/**
 * Schema de validação para publicação de projeto
 */
export const publishProjetoSchema = z.object({
  id: z.string().uuid("ID de projeto inválido"),
});

/**
 * Schema de validação para listagem de projetos (query params)
 */
export const listProjetosSchema = z.object({
  page: z.coerce.number().min(1).default(1),

  limit: z.coerce.number().min(1).max(100).default(10),

  status: z.nativeEnum(StatusProjeto).optional(),

  entidadeId: z.string().uuid().optional(),

  tags: z.string().optional(),

  search: z.string().optional(),

  orderBy: z.enum(["criadoEm", "publicadoEm", "titulo"]).default("criadoEm"),

  order: z.enum(["asc", "desc"]).default("desc"),
});

export type ProjetoAutorInput = z.infer<typeof projetoAutorSchema>;
export type CreateProjetoInput = z.infer<typeof createProjetoSchema>;
export type UpdateProjetoInput = z.infer<typeof updateProjetoSchema>;
export type UpdateProjetoAutoresInput = z.infer<typeof updateProjetoAutoresSchema>;
export type PublishProjetoInput = z.infer<typeof publishProjetoSchema>;
export type ListProjetosInput = z.infer<typeof listProjetosSchema>;
