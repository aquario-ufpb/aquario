import { Request, Response } from 'express';
import { z } from 'zod';
import { CriarGuiaUseCase } from '@/application/guias/use-cases/CriarGuiaUseCase';
import { PrismaGuiasRepository } from '@/infra/database/prisma/repositories/PrismaGuiasRepository';
import { PrismaCursosRepository } from '@/infra/database/prisma/repositories/PrismaCursosRepository';
import { StatusGuia } from '@prisma/client';

const criarGuiaBodySchema = z.object({
  titulo: z.string(),
  slug: z.string(),
  descricao: z.string().optional(),
  status: z.nativeEnum(StatusGuia).optional(),
  cursoId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export class CriarGuiaController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { titulo, slug, descricao, status, cursoId, tags } = criarGuiaBodySchema.parse(
        request.body
      );

      const guiasRepository = new PrismaGuiasRepository();
      const cursosRepository = new PrismaCursosRepository();
      const criarGuiaUseCase = new CriarGuiaUseCase(guiasRepository, cursosRepository);

      await criarGuiaUseCase.execute({
        titulo,
        slug,
        descricao,
        status,
        cursoId,
        tags,
      });

      return response.status(201).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.status(400).json({
          message: 'Validation error.',
          issues: error.format(),
        });
      }
      if (error instanceof Error) {
        if (error.message === 'Curso não encontrado.') {
          return response.status(404).json({ message: error.message });
        }
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
