import { Request, Response } from 'express';
import { BuscarGuiaPorSlugUseCase } from '@/application/guias/use-cases/BuscarGuiaPorSlugUseCase';
import { PrismaGuiasRepository } from '@/infra/database/prisma/repositories/PrismaGuiasRepository';

export class BuscarGuiaPorSlugController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { slug } = request.params;

      const guiasRepository = new PrismaGuiasRepository();
      const buscarGuiaPorSlugUseCase = new BuscarGuiaPorSlugUseCase(guiasRepository);

      const { guia } = await buscarGuiaPorSlugUseCase.execute(slug);

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
