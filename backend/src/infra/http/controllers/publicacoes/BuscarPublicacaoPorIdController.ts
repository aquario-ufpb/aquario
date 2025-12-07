import { Request, Response } from 'express';
import { z } from 'zod';
import { BuscarPublicacaoPorIdUseCase } from '@/application/publicacoes/use-cases/BuscarPublicacaoPorIdUseCase';
import { PrismaPublicacoesRepository } from '@/infra/database/prisma/repositories/PrismaPublicacoesRepository';

const buscarPublicacaoParamsSchema = z.object({
  id: z.string(),
});

export class BuscarPublicacaoPorIdController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = buscarPublicacaoParamsSchema.parse(request.params);

      const publicacoesRepository = new PrismaPublicacoesRepository();
      const buscarPublicacaoUseCase = new BuscarPublicacaoPorIdUseCase(publicacoesRepository);

      const { publicacao } = await buscarPublicacaoUseCase.execute({ id });

      if (!publicacao) {
        return response.status(404).json({ message: 'Publicação não encontrada.' });
      }

      const responseData = {
        id: publicacao.id,
        ...publicacao.props,
      };

      return response.status(200).json(responseData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.status(400).json({ 
          message: 'Validation error.', 
          issues: error.format(),
        });
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
