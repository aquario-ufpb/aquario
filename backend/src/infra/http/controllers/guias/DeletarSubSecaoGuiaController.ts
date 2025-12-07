import { Request, Response } from 'express';
import { DeletarSubSecaoGuiaUseCase } from '@/application/guias/use-cases/DeletarSubSecaoGuiaUseCase';
import { PrismaSubSecoesGuiaRepository } from '@/infra/database/prisma/repositories/PrismaSubSecoesGuiaRepository';

export class DeletarSubSecaoGuiaController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params;

      const subSecoesGuiaRepository = new PrismaSubSecoesGuiaRepository();
      const deletarSubSecaoGuiaUseCase = new DeletarSubSecaoGuiaUseCase(subSecoesGuiaRepository);

      await deletarSubSecaoGuiaUseCase.execute(id);

      return response.status(200).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Subseção não encontrada.') {
          return response.status(404).json({ message: error.message });
        }
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
