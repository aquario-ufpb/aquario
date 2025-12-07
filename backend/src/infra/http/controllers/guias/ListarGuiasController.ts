import { Request, Response } from 'express';
import { ListarGuiasUseCase } from '@/application/guias/use-cases/ListarGuiasUseCase';
import { PrismaGuiasRepository } from '@/infra/database/prisma/repositories/PrismaGuiasRepository';

export class ListarGuiasController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { cursoId } = request.query;

      const guiasRepository = new PrismaGuiasRepository();
      const listarGuiasUseCase = new ListarGuiasUseCase(guiasRepository);

      const { guias } = await listarGuiasUseCase.execute({
        cursoId: cursoId as string,
      });

      const responseData = guias.map(g => ({
        id: g.id,
        ...g.props,
      }));

      return response.status(200).json(responseData);
    } catch {
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
