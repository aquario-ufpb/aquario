import { Request, Response } from 'express';
import { z } from 'zod';
import { BuscarItemAchadoEPerdidoPorIdUseCase } from '@/application/achados-e-perdidos/use-cases/BuscarItemAchadoEPerdidoPorIdUseCase';
import { PrismaItensAchadosEPerdidosRepository } from '@/infra/database/prisma/repositories/PrismaItensAchadosEPerdidosRepository';

const buscarItemParamsSchema = z.object({
  id: z.string(),
});

export class BuscarItemAchadoEPerdidoPorIdController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = buscarItemParamsSchema.parse(request.params);

      const itensRepository = new PrismaItensAchadosEPerdidosRepository();
      const buscarItemUseCase = new BuscarItemAchadoEPerdidoPorIdUseCase(itensRepository);

      const { item } = await buscarItemUseCase.execute({ id });

      if (!item) {
        return response.status(404).json({ message: 'Item não encontrado.' });
      }

      const responseData = {
        id: item.id,
        ...item.props,
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
