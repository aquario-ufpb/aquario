import { Request, Response } from 'express';
import { ListarItensAchadosEPerdidosUseCase } from '@/application/achados-e-perdidos/use-cases/ListarItensAchadosEPerdidosUseCase';
import { PrismaItensAchadosEPerdidosRepository } from '@/infra/database/prisma/repositories/PrismaItensAchadosEPerdidosRepository';

export class ListarItensAchadosEPerdidosController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const itensRepository = new PrismaItensAchadosEPerdidosRepository();
      const listarItensUseCase = new ListarItensAchadosEPerdidosUseCase(itensRepository);

      const { itens } = await listarItensUseCase.execute();

      const responseData = itens.map(item => ({
        id: item.id,
        ...item.props,
      }));

      return response.status(200).json(responseData);
    } catch {
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
