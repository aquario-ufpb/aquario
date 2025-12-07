import { Request, Response } from 'express';
import { ListarCentrosUseCase } from '@/application/centros/use-cases/ListarCentrosUseCase';
import { PrismaCentrosRepository } from '@/infra/database/prisma/repositories/PrismaCentrosRepository';

export class ListarCentrosController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const centrosRepository = new PrismaCentrosRepository();
      const listarCentrosUseCase = new ListarCentrosUseCase(centrosRepository);

      const centros = await listarCentrosUseCase.execute();

      return response.status(200).json(centros);
    } catch {
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
