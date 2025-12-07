import { Request, Response } from 'express';
import { z } from 'zod';
import { EditarSubSecaoGuiaUseCase } from '@/application/guias/use-cases/EditarSubSecaoGuiaUseCase';
import { PrismaSubSecoesGuiaRepository } from '@/infra/database/prisma/repositories/PrismaSubSecoesGuiaRepository';
import { StatusGuia } from '@prisma/client';

const editarSubSecaoGuiaBodySchema = z.object({
  titulo: z.string().optional(),
  slug: z.string().optional(),
  ordem: z.number().optional(),
  conteudo: z.string().optional(),
  status: z.nativeEnum(StatusGuia).optional(),
});

export class EditarSubSecaoGuiaController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params;
      const body = editarSubSecaoGuiaBodySchema.parse(request.body);

      const subSecoesGuiaRepository = new PrismaSubSecoesGuiaRepository();
      const editarSubSecaoGuiaUseCase = new EditarSubSecaoGuiaUseCase(subSecoesGuiaRepository);

      await editarSubSecaoGuiaUseCase.execute({
        id,
        ...body,
      });

      return response.status(200).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.status(400).json({
          message: 'Validation error.',
          issues: error.format(),
        });
      }
      if (error instanceof Error) {
        if (error.message === 'Subseção não encontrada.') {
          return response.status(404).json({ message: error.message });
        }
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
