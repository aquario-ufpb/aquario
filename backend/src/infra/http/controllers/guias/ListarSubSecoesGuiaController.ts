import { Request, Response } from 'express';
import { ListarSubSecoesGuiaUseCase } from '@/application/guias/use-cases/ListarSubSecoesGuiaUseCase';
import { PrismaSubSecoesGuiaRepository } from '@/infra/database/prisma/repositories/PrismaSubSecoesGuiaRepository';

export class ListarSubSecoesGuiaController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { secaoId } = request.query;

      if (!secaoId || typeof secaoId !== 'string') {
        return response.status(400).json({ message: 'secaoId is required.' });
      }

      const subSecoesGuiaRepository = new PrismaSubSecoesGuiaRepository();
      const listarSubSecoesGuiaUseCase = new ListarSubSecoesGuiaUseCase(subSecoesGuiaRepository);

      const { subSecoes } = await listarSubSecoesGuiaUseCase.execute({
        secaoId,
      });

      const responseData = subSecoes.map(s => ({
        id: s.id,
        ...s.props,
      }));

      return response.status(200).json(responseData);
    } catch {
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
