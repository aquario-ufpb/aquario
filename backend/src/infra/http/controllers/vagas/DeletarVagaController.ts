import { Request, Response } from 'express';
import { z } from 'zod';
import { DeletarVagaUseCase } from '@/application/vagas/use-cases/DeletarVagaUseCase';
import { PrismaVagasRepository } from '@/infra/database/prisma/repositories/PrismaVagasRepository';

const deletarVagaParamsSchema = z.object({
  id: z.string(),
});

export class DeletarVagaController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = deletarVagaParamsSchema.parse(request.params);
      const publicadorId = request.usuario.id;

      const vagasRepository = new PrismaVagasRepository();
      const deletarVagaUseCase = new DeletarVagaUseCase(vagasRepository);

      await deletarVagaUseCase.execute({
        vagaId: id,
        publicadorId,
      });

      return response.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.status(400).json({
          message: 'Validation error.',
          issues: error.format(),
        });
      }
      if (error instanceof Error) {
        if (error.message === 'Vaga não encontrada.' || error.message === 'Ação não autorizada.') {
          return response.status(403).json({ message: error.message });
        }
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
