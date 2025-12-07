import { Request, Response } from 'express';
import { z } from 'zod';
import { ListarCursosPorCentroUseCase } from '@/application/cursos/use-cases/ListarCursosPorCentroUseCase';
import { PrismaCursosRepository } from '@/infra/database/prisma/repositories/PrismaCursosRepository';

const listarCursosPorCentroParamsSchema = z.object({
  id: z.string(),
});

export class ListarCursosPorCentroController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = listarCursosPorCentroParamsSchema.parse(request.params);

      const cursosRepository = new PrismaCursosRepository();
      const listarCursosPorCentroUseCase = new ListarCursosPorCentroUseCase(cursosRepository);

      const cursos = await listarCursosPorCentroUseCase.execute({ centroId: id });

      return response.status(200).json(cursos);
    } catch {
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
