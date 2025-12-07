import { Request, Response } from 'express';
import { DeletarSecaoGuiaUseCase } from '@/application/guias/use-cases/DeletarSecaoGuiaUseCase';
import { PrismaSecoesGuiaRepository } from '@/infra/database/prisma/repositories/PrismaSecoesGuiaRepository';

export class DeletarSecaoGuiaController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params;

      const secoesGuiaRepository = new PrismaSecoesGuiaRepository();
      const deletarSecaoGuiaUseCase = new DeletarSecaoGuiaUseCase(secoesGuiaRepository);

      await deletarSecaoGuiaUseCase.execute(id);

      return response.status(200).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Seção não encontrada.') {
          return response.status(404).json({ message: error.message });
        }
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
