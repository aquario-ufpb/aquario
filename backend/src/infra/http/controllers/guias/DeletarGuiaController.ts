import { Request, Response } from 'express';
import { DeletarGuiaUseCase } from '@/application/guias/use-cases/DeletarGuiaUseCase';
import { PrismaGuiasRepository } from '@/infra/database/prisma/repositories/PrismaGuiasRepository';

export class DeletarGuiaController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params;

      const guiasRepository = new PrismaGuiasRepository();
      const deletarGuiaUseCase = new DeletarGuiaUseCase(guiasRepository);

      await deletarGuiaUseCase.execute(id);

      return response.status(200).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Guia não encontrada.') {
          return response.status(404).json({ message: error.message });
        }
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
