import { Request, Response } from 'express';
import { z } from 'zod';
import { EditarPublicacaoUseCase } from '@/application/publicacoes/use-cases/EditarPublicacaoUseCase';
import { PrismaPublicacoesRepository } from '@/infra/database/prisma/repositories/PrismaPublicacoesRepository';

const editarPublicacaoParamsSchema = z.object({
  id: z.string(),
});

const editarPublicacaoBodySchema = z.object({
  titulo: z.string(),
  conteudo: z.string(),
});

export class EditarPublicacaoController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = editarPublicacaoParamsSchema.parse(request.params);
      const { titulo, conteudo } = editarPublicacaoBodySchema.parse(request.body);
      const autorId = request.usuario.id;

      const publicacoesRepository = new PrismaPublicacoesRepository();
      const editarPublicacaoUseCase = new EditarPublicacaoUseCase(publicacoesRepository);

      await editarPublicacaoUseCase.execute({ publicacaoId: id, autorId, titulo, conteudo });

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
