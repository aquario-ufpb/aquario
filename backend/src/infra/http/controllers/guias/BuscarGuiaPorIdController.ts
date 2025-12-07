import { Request, Response } from 'express';
import { BuscarGuiaPorIdUseCase } from '@/application/guias/use-cases/BuscarGuiaPorIdUseCase';
import { PrismaGuiasRepository } from '@/infra/database/prisma/repositories/PrismaGuiasRepository';

export class BuscarGuiaPorIdController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = request.params;

      const guiasRepository = new PrismaGuiasRepository();
      const buscarGuiaPorIdUseCase = new BuscarGuiaPorIdUseCase(guiasRepository);

      const { guia } = await buscarGuiaPorIdUseCase.execute(id);

      const responseData = {
        id: guia.id,
        ...guia.props,
      };

      return response.status(200).json(responseData);
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
