import { Request, Response } from 'express';
import { z } from 'zod';
import { EditarGuiaUseCase } from '@/application/guias/use-cases/EditarGuiaUseCase';
import { PrismaGuiasRepository } from '@/infra/database/prisma/repositories/PrismaGuiasRepository';
import { PrismaCursosRepository } from '@/infra/database/prisma/repositories/PrismaCursosRepository';
import { StatusGuia } from '@prisma/client';

const editarGuiaBodySchema = z.object({
  titulo: z.string().optional(),
  slug: z.string().optional(),
  descricao: z.string().optional(),
  status: z.nativeEnum(StatusGuia).optional(),
  cursoId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export class EditarGuiaController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params;
      const body = editarGuiaBodySchema.parse(request.body);

      const guiasRepository = new PrismaGuiasRepository();
      const cursosRepository = new PrismaCursosRepository();
      const editarGuiaUseCase = new EditarGuiaUseCase(guiasRepository, cursosRepository);

      await editarGuiaUseCase.execute({
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
        if (error.message === 'Guia não encontrada.' || error.message === 'Curso não encontrado.') {
          return response.status(404).json({ message: error.message });
        }
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
