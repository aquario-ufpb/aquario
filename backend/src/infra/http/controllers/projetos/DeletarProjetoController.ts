import { Request, Response } from 'express';
import { z } from 'zod';
import { DeletarProjetoUseCase } from '@/application/projetos/use-cases/DeletarProjetoUseCase';
import { PrismaProjetosRepository } from '@/infra/database/prisma/repositories/PrismaProjetosRepository';

const deletarProjetoParamsSchema = z.object({
  id: z.string(),
});

export class DeletarProjetoController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = deletarProjetoParamsSchema.parse(request.params);
      const criadorId = request.usuario.id;

      const projetosRepository = new PrismaProjetosRepository();
      const deletarProjetoUseCase = new DeletarProjetoUseCase(projetosRepository);

      await deletarProjetoUseCase.execute({
        projetoId: id,
        criadorId,
      });

      return response.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.status(400).json({
          message: 'Validation error.',
          issues: error.format(),
        });
      }
      if (error instanceof Error) {
        if (
          error.message === 'Projeto não encontrado.' ||
          error.message === 'Ação não autorizada.'
        ) {
          return response.status(403).json({ message: error.message });
        }
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
