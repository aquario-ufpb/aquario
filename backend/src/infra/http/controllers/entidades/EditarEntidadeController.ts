import { Request, Response } from 'express';
import { z } from 'zod';
import { EditarEntidadeUseCase } from '@/application/entidades/use-cases/EditarEntidadeUseCase';
import { PrismaEntidadesRepository } from '@/infra/database/prisma/repositories/PrismaEntidadesRepository';
import { PrismaMembroEntidadeRepository } from '@/infra/database/prisma/repositories/PrismaMembroEntidadeRepository';
import { PrismaUsuariosRepository } from '@/infra/database/prisma/repositories/PrismaUsuariosRepository';
import { logger } from '@/infra/logger';

const log = logger.child('controller:editar-entidade');

const editarEntidadeParamsSchema = z.object({
  id: z.string().uuid(),
});

const editarEntidadeBodySchema = z.object({
  nome: z.string().optional(),
  subtitle: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
  tipo: z.string().optional(),
  urlFoto: z.string().nullable().optional(),
  contato: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  foundingDate: z
    .string()
    .nullable()
    .optional()
    .transform(val => (val ? new Date(val) : null)),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  slug: z.string().optional(), // Custom slug (will be stored in metadata)
});

export class EditarEntidadeController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = editarEntidadeParamsSchema.parse(request.params);
      const body = editarEntidadeBodySchema.parse(request.body);
      const usuarioId = request.usuario.id;

      log.info('Requisição de edição de entidade recebida', {
        entidadeId: id,
        usuarioId,
        fields: Object.keys(body),
      });

      const entidadesRepository = new PrismaEntidadesRepository();
      const membroEntidadeRepository = new PrismaMembroEntidadeRepository();
      const usuariosRepository = new PrismaUsuariosRepository();
      const editarEntidadeUseCase = new EditarEntidadeUseCase(
        entidadesRepository,
        membroEntidadeRepository,
        usuariosRepository
      );

      await editarEntidadeUseCase.execute({
        entidadeId: id,
        usuarioId,
        data: {
          ...body,
          slug: body.slug, // slug will be merged into metadata by use case
        },
      });

      return response.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.warn('Falha de validação ao editar entidade', {
          issues: error.issues.map(issue => issue.message),
        });
        return response.status(400).json({
          message: 'Validation error.',
          issues: error.format(),
        });
      }
      if (error instanceof Error) {
        log.warn('Falha ao editar entidade', { message: error.message });
        if (
          error.message === 'Entidade não encontrada.' ||
          error.message === 'Usuário não encontrado.'
        ) {
          return response.status(404).json({ message: error.message });
        }
        if (error.message === 'Você não tem permissão para editar esta entidade.') {
          return response.status(403).json({ message: error.message });
        }
        return response.status(500).json({ message: error.message });
      }
      log.error('Erro inesperado ao editar entidade', error);
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
