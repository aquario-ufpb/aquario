import { Request, Response } from 'express';
import { BuscarEntidadePorSlugUseCase } from '@/application/entidades/use-cases/BuscarEntidadePorSlugUseCase';
import { PrismaEntidadesRepository } from '@/infra/database/prisma/repositories/PrismaEntidadesRepository';
import { PrismaMembroEntidadeRepository } from '@/infra/database/prisma/repositories/PrismaMembroEntidadeRepository';

export class BuscarEntidadePorSlugController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { slug } = request.params;

      const entidadesRepository = new PrismaEntidadesRepository();
      const membroEntidadeRepository = new PrismaMembroEntidadeRepository();
      const useCase = new BuscarEntidadePorSlugUseCase(entidadesRepository);

      const { entidade } = await useCase.execute(slug);

      if (!entidade) {
        return response.status(404).json({ message: 'Entidade não encontrada.' });
      }

      // Get membros for this entidade
      const membros = await membroEntidadeRepository.findManyByEntidadeId(entidade.id);

      const responseData = {
        id: entidade.id,
        ...entidade.props,
        membros: membros.map(m => ({
          id: m.id,
          usuario: m.usuario,
          papel: m.papel,
        })),
      };

      return response.status(200).json(responseData);
    } catch {
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
