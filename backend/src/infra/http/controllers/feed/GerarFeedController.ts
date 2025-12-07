import { Request, Response } from 'express';
import { GerarFeedUseCase } from '@/application/feed/use-cases/GerarFeedUseCase';
import { PrismaProjetosRepository } from '@/infra/database/prisma/repositories/PrismaProjetosRepository';
import { PrismaVagasRepository } from '@/infra/database/prisma/repositories/PrismaVagasRepository';
import { PrismaPublicacoesRepository } from '@/infra/database/prisma/repositories/PrismaPublicacoesRepository';

export class GerarFeedController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const projetosRepository = new PrismaProjetosRepository();
      const vagasRepository = new PrismaVagasRepository();
      const publicacoesRepository = new PrismaPublicacoesRepository();
      const useCase = new GerarFeedUseCase(
        projetosRepository,
        vagasRepository,
        publicacoesRepository
      );

      const { feed } = await useCase.execute();

      return response.status(200).json(feed);
    } catch {
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
