import { Request, Response } from 'express';
import { z } from 'zod';
import { CriarProjetoUseCase } from '@/application/projetos/use-cases/CriarProjetoUseCase';
import { PrismaProjetosRepository } from '@/infra/database/prisma/repositories/PrismaProjetosRepository';
import { PrismaUsuariosRepository } from '@/infra/database/prisma/repositories/PrismaUsuariosRepository';
import { PrismaCentrosRepository } from '@/infra/database/prisma/repositories/PrismaCentrosRepository';
import { TipoProjeto } from '@prisma/client';

const criarProjetoBodySchema = z.object({
  titulo: z.string(),
  descricao: z.string(),
  tipo: z.nativeEnum(TipoProjeto),
  centroId: z.string().uuid(),
  tags: z.array(z.string()),
  urlFoto: z.string().url().optional(),
  url: z.string().url().optional(),
  membroIds: z.array(z.string().uuid()).optional(),
});

export class CriarProjetoController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { titulo, descricao, tipo, centroId, tags, urlFoto, url, membroIds } =
        criarProjetoBodySchema.parse(request.body);
      const criadorId = request.usuario.id;

      const projetosRepository = new PrismaProjetosRepository();
      const usuariosRepository = new PrismaUsuariosRepository();
      const centrosRepository = new PrismaCentrosRepository();
      const criarProjetoUseCase = new CriarProjetoUseCase(
        projetosRepository,
        usuariosRepository,
        centrosRepository
      );

      await criarProjetoUseCase.execute({
        titulo,
        descricao,
        tipo,
        criadorId,
        centroId,
        tags,
        urlFoto,
        url,
        membroIds,
      });

      return response.status(201).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.status(400).json({
          message: 'Validation error.',
          issues: error.format(),
        });
      }
      console.error('Erro ao criar projeto:', error);

      if (error instanceof Error) {
        if (
          error.message === 'Criador não encontrado.' ||
          error.message === 'Centro não encontrado.'
        ) {
          return response.status(404).json({ message: error.message });
        }
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
