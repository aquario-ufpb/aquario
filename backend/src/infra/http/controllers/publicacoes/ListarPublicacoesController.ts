import { Request, Response } from 'express';
import { ListarPublicacoesUseCase } from '@/application/publicacoes/use-cases/ListarPublicacoesUseCase';
import { PrismaPublicacoesRepository } from '@/infra/database/prisma/repositories/PrismaPublicacoesRepository';

export class ListarPublicacoesController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const publicacoesRepository = new PrismaPublicacoesRepository();
      const listarPublicacoesUseCase = new ListarPublicacoesUseCase(publicacoesRepository);

      const { publicacoes } = await listarPublicacoesUseCase.execute();

      const responseData = publicacoes.map(p => ({
        id: p.id,
        ...p.props,
      }));

      return response.status(200).json(responseData);
    } catch {
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
