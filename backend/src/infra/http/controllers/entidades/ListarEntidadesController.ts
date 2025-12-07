import { Request, Response } from 'express';
import { ListarEntidadesUseCase } from '@/application/entidades/use-cases/ListarEntidadesUseCase';
import { PrismaEntidadesRepository } from '@/infra/database/prisma/repositories/PrismaEntidadesRepository';

export class ListarEntidadesController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const entidadesRepository = new PrismaEntidadesRepository();
      const useCase = new ListarEntidadesUseCase(entidadesRepository);

      const { entidades } = await useCase.execute();

      const responseData = entidades.map(entidade => ({
        id: entidade.id,
        ...entidade.props,
      }));

      return response.status(200).json(responseData);
    } catch {
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
