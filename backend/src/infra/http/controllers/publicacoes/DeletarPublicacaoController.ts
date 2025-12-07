import { Request, Response } from 'express';
import { z } from 'zod';
import { DeletarPublicacaoUseCase } from '@/application/publicacoes/use-cases/DeletarPublicacaoUseCase';
import { PrismaPublicacoesRepository } from '@/infra/database/prisma/repositories/PrismaPublicacoesRepository';

const deletarPublicacaoParamsSchema = z.object({
  id: z.string(),
});

export class DeletarPublicacaoController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = deletarPublicacaoParamsSchema.parse(request.params);
      const autorId = request.usuario.id;

      const publicacoesRepository = new PrismaPublicacoesRepository();
      const deletarPublicacaoUseCase = new DeletarPublicacaoUseCase(publicacoesRepository);

      await deletarPublicacaoUseCase.execute({ publicacaoId: id, autorId });

      return response.status(204).send();
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
