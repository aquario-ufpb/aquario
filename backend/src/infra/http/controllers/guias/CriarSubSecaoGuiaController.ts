import { Request, Response } from 'express';
import { z } from 'zod';
import { CriarSubSecaoGuiaUseCase } from '@/application/guias/use-cases/CriarSubSecaoGuiaUseCase';
import { PrismaSubSecoesGuiaRepository } from '@/infra/database/prisma/repositories/PrismaSubSecoesGuiaRepository';
import { PrismaSecoesGuiaRepository } from '@/infra/database/prisma/repositories/PrismaSecoesGuiaRepository';
import { StatusGuia } from '@prisma/client';

const criarSubSecaoGuiaBodySchema = z.object({
  secaoId: z.string(),
  titulo: z.string(),
  slug: z.string(),
  ordem: z.number(),
  conteudo: z.string().optional(),
  status: z.nativeEnum(StatusGuia).optional(),
});

export class CriarSubSecaoGuiaController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { secaoId, titulo, slug, ordem, conteudo, status } = criarSubSecaoGuiaBodySchema.parse(
        request.body
      );

      const subSecoesGuiaRepository = new PrismaSubSecoesGuiaRepository();
      const secoesGuiaRepository = new PrismaSecoesGuiaRepository();
      const criarSubSecaoGuiaUseCase = new CriarSubSecaoGuiaUseCase(
        subSecoesGuiaRepository,
        secoesGuiaRepository
      );

      await criarSubSecaoGuiaUseCase.execute({
        secaoId,
        titulo,
        slug,
        ordem,
        conteudo,
        status,
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
        if (error.message === 'Seção não encontrada.') {
          return response.status(404).json({ message: error.message });
        }
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
