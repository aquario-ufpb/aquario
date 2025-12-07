import { Request, Response } from 'express';
import { z } from 'zod';
import { BuscarVagaPorIdUseCase } from '@/application/vagas/use-cases/BuscarVagaPorIdUseCase';
import { PrismaVagasRepository } from '@/infra/database/prisma/repositories/PrismaVagasRepository';

const paramsSchema = z.object({ id: z.string().uuid() });

export class BuscarVagaPorIdController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = paramsSchema.parse(request.params);

      const vagasRepository = new PrismaVagasRepository();
      const useCase = new BuscarVagaPorIdUseCase(vagasRepository);

      const { vaga } = await useCase.execute({ id });

      if (!vaga) {
        return response.status(404).json({ message: 'Vaga não encontrada.' });
      }

      const responseData = {
        id: vaga.id,
        ...vaga.props,
      };

      return response.status(200).json(responseData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.status(400).json({ message: 'Validation error.', issues: error.format() });
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
