import { Request, Response } from 'express';
import { z } from 'zod';
import { BuscarEntidadePorIdUseCase } from '@/application/entidades/use-cases/BuscarEntidadePorIdUseCase';
import { PrismaEntidadesRepository } from '@/infra/database/prisma/repositories/PrismaEntidadesRepository';
import { PrismaMembroEntidadeRepository } from '@/infra/database/prisma/repositories/PrismaMembroEntidadeRepository';

const paramsSchema = z.object({ id: z.string().uuid() });

export class BuscarEntidadePorIdController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = paramsSchema.parse(request.params);

      const entidadesRepository = new PrismaEntidadesRepository();
      const membroEntidadeRepository = new PrismaMembroEntidadeRepository();
      const useCase = new BuscarEntidadePorIdUseCase(entidadesRepository, membroEntidadeRepository);

      const { entidade, membros } = await useCase.execute({ id });

      if (!entidade) {
        return response.status(404).json({ message: 'Entidade não encontrada.' });
      }

      const responseData = {
        id: entidade.id,
        ...entidade.props,
        membros,
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
