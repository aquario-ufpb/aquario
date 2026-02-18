import { z } from 'zod';
import { StatusProjeto, TipoConteudo } from '@prisma/client';

/**
 * Schema de validação para autor do projeto
 * Apenas autores internos (usuários do sistema)
 */
export const projetoAutorSchema = z.object({
  usuarioId: z.string().uuid('ID de usuário inválido'),
  autorPrincipal: z.boolean().default(false),
});

/**
 * Schema de validação para criação de projeto
 */
export const createProjetoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(255),
  slug: z.string()
    .min(1, 'Slug é obrigatório')
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  subtitulo: z.string().max(500).optional().nullable(),
  descricao: z.string().max(1000).optional().nullable(),
  textContent: z.string().optional().nullable(),
  tipoConteudo: z.nativeEnum(TipoConteudo).default(TipoConteudo.MARKDOWN),
  urlImagem: z.string().url('URL da imagem inválida').optional().nullable(),
  status: z.nativeEnum(StatusProjeto).default(StatusProjeto.RASCUNHO),
  tags: z.array(z.string().max(50)).default([]),
  dataInicio: z.coerce.date().optional().nullable(),
  dataFim: z.coerce.date().optional().nullable(),
  urlRepositorio: z.string().url('URL do repositório inválida').optional().nullable(),
  urlDemo: z.string().url('URL da demo inválida').optional().nullable(),
  urlPublicacao: z.string().url('URL da publicação inválida').optional().nullable(),
  entidadeId: z.string().uuid('ID de entidade inválido').optional().nullable(),
  autores: z.array(projetoAutorSchema).min(1, 'Pelo menos um autor é obrigatório'),
}).refine(
  (data: { dataInicio?: Date | null; dataFim?: Date | null }) => {
    if (data.dataInicio && data.dataFim) {
      return data.dataFim >= data.dataInicio;
    }
    return true;
  },
  {
    message: 'Data de fim deve ser posterior à data de início',
    path: ['dataFim'],
  }
).refine(
  (data: { autores: Array<{ autorPrincipal: boolean }> }) => {
    // Pelo menos um autor deve ser principal
    const temAutorPrincipal = data.autores.some((a: { autorPrincipal: boolean }) => a.autorPrincipal);
    return temAutorPrincipal;
  },
  {
    message: 'Pelo menos um autor deve ser marcado como principal',
    path: ['autores'],
  }
);

/**
 * Schema de validação para atualização de projeto
 */
export const updateProjetoSchema = createProjetoSchema.partial().omit({ autores: true });

/**
 * Schema de validação para adicionar/atualizar autores de um projeto
 */
export const updateProjetoAutoresSchema = z.object({
  autores: z.array(projetoAutorSchema).min(1, 'Pelo menos um autor é obrigatório'),
}).refine(
  (data: { autores: Array<{ autorPrincipal: boolean }> }) => {
    const temAutorPrincipal = data.autores.some((a: { autorPrincipal: boolean }) => a.autorPrincipal);
    return temAutorPrincipal;
  },
  {
    message: 'Pelo menos um autor deve ser marcado como principal',
    path: ['autores'],
  }
);

/**
 * Schema de validação para publicação de projeto
 */
export const publishProjetoSchema = z.object({
  id: z.string().uuid('ID de projeto inválido'),
});

/**
 * Schema de validação para listagem de projetos (query params)
 */
export const listProjetosSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(StatusProjeto).optional(),
  entidadeId: z.string().uuid().optional(),
  tags: z.string().optional(), // Comma-separated tags
  search: z.string().optional(),
  orderBy: z.enum(['criadoEm', 'publicadoEm', 'titulo']).default('criadoEm'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type ProjetoAutorInput = z.infer<typeof projetoAutorSchema>;
export type CreateProjetoInput = z.infer<typeof createProjetoSchema>;
export type UpdateProjetoInput = z.infer<typeof updateProjetoSchema>;
export type UpdateProjetoAutoresInput = z.infer<typeof updateProjetoAutoresSchema>;
export type PublishProjetoInput = z.infer<typeof publishProjetoSchema>;
export type ListProjetosInput = z.infer<typeof listProjetosSchema>;

