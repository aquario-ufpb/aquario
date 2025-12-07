import { Request, Response } from 'express';
import { z } from 'zod';
import { BuscarProjetoPorIdUseCase } from '@/application/projetos/use-cases/BuscarProjetoPorIdUseCase';
import { PrismaProjetosRepository } from '@/infra/database/prisma/repositories/PrismaProjetosRepository';
import { Projeto } from '@/domain/projetos/entities/Projeto';

const paramsSchema = z.object({ id: z.string().uuid() });

export class BuscarProjetoPorIdController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = paramsSchema.parse(request.params);

      const projetosRepository = new PrismaProjetosRepository();
      const useCase = new BuscarProjetoPorIdUseCase(projetosRepository);

      const { projeto } = await useCase.execute({ id });

      if (!projeto) {
        return response.status(404).json({ message: 'Projeto não encontrado.' });
      }

      const responseData = {
        id: projeto.id,
        ...projeto.props,
      };

      (responseData as Record<string, unknown>).membros = (projeto as Projeto).props.membros;

      return response.status(200).json(responseData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.status(400).json({ message: 'Validation error.', issues: error.format() });
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
