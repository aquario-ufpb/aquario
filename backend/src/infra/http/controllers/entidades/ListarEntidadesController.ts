import { Request, Response } from 'express';
import { ListarEntidadesUseCase } from '@/application/entidades/use-cases/ListarEntidadesUseCase';
import { PrismaEntidadesRepository } from '@/infra/database/prisma/repositories/PrismaEntidadesRepository';
import { prisma } from '@/infra/database/prisma';

export class ListarEntidadesController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const entidadesRepository = new PrismaEntidadesRepository();
      const useCase = new ListarEntidadesUseCase(entidadesRepository);

      const { entidades } = await useCase.execute();

      // Get unique centro IDs
      const centroIds = [...new Set(entidades.map(e => e.props.centroId))];

      // Batch fetch all centros
      const centros = await prisma.centro.findMany({
        where: {
          id: {
            in: centroIds,
          },
        },
        select: {
          id: true,
          nome: true,
          sigla: true,
        },
      });

      // Create a map for quick lookup
      const centroMap = new Map(centros.map(c => [c.id, c]));

      // Map entidades with centro information
      const responseData = entidades.map(entidade => ({
        id: entidade.id,
        ...entidade.props,
        centro: centroMap.get(entidade.props.centroId) || null,
      }));

      return response.status(200).json(responseData);
    } catch {
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
