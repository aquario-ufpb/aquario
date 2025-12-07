import { Request, Response } from 'express';
import { z } from 'zod';
import { CriarSecaoGuiaUseCase } from '@/application/guias/use-cases/CriarSecaoGuiaUseCase';
import { PrismaSecoesGuiaRepository } from '@/infra/database/prisma/repositories/PrismaSecoesGuiaRepository';
import { PrismaGuiasRepository } from '@/infra/database/prisma/repositories/PrismaGuiasRepository';
import { StatusGuia } from '@prisma/client';

const criarSecaoGuiaBodySchema = z.object({
  guiaId: z.string(),
  titulo: z.string(),
  slug: z.string(),
  ordem: z.number(),
  conteudo: z.string().optional(),
  status: z.nativeEnum(StatusGuia).optional(),
});

export class CriarSecaoGuiaController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { guiaId, titulo, slug, ordem, conteudo, status } = criarSecaoGuiaBodySchema.parse(
        request.body
      );

      const secoesGuiaRepository = new PrismaSecoesGuiaRepository();
      const guiasRepository = new PrismaGuiasRepository();
      const criarSecaoGuiaUseCase = new CriarSecaoGuiaUseCase(
        secoesGuiaRepository,
        guiasRepository
      );

      await criarSecaoGuiaUseCase.execute({
        guiaId,
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
        if (error.message === 'Guia não encontrada.') {
          return response.status(404).json({ message: error.message });
        }
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
