import { Request, Response } from 'express';
import { z } from 'zod';
import { EditarSecaoGuiaUseCase } from '@/application/guias/use-cases/EditarSecaoGuiaUseCase';
import { PrismaSecoesGuiaRepository } from '@/infra/database/prisma/repositories/PrismaSecoesGuiaRepository';
import { StatusGuia } from '@prisma/client';

const editarSecaoGuiaBodySchema = z.object({
  titulo: z.string().optional(),
  slug: z.string().optional(),
  ordem: z.number().optional(),
  conteudo: z.string().optional(),
  status: z.nativeEnum(StatusGuia).optional(),
});

export class EditarSecaoGuiaController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params;
      const body = editarSecaoGuiaBodySchema.parse(request.body);

      const secoesGuiaRepository = new PrismaSecoesGuiaRepository();
      const editarSecaoGuiaUseCase = new EditarSecaoGuiaUseCase(secoesGuiaRepository);

      await editarSecaoGuiaUseCase.execute({
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
        if (error.message === 'Seção não encontrada.') {
          return response.status(404).json({ message: error.message });
        }
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
