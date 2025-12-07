import { Request, Response } from 'express';
import { ListarSecoesGuiaUseCase } from '@/application/guias/use-cases/ListarSecoesGuiaUseCase';
import { PrismaSecoesGuiaRepository } from '@/infra/database/prisma/repositories/PrismaSecoesGuiaRepository';

export class ListarSecoesGuiaController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { guiaId } = request.query;

      if (!guiaId || typeof guiaId !== 'string') {
        return response.status(400).json({ message: 'guiaId is required.' });
      }

      const secoesGuiaRepository = new PrismaSecoesGuiaRepository();
      const listarSecoesGuiaUseCase = new ListarSecoesGuiaUseCase(secoesGuiaRepository);

      const { secoes } = await listarSecoesGuiaUseCase.execute({ guiaId });

      const responseData = secoes.map(s => ({
        id: s.id,
        ...s.props,
      }));

      return response.status(200).json(responseData);
    } catch {
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
