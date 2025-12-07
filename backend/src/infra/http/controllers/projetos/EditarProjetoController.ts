import { Request, Response } from 'express';
import { z } from 'zod';
import { EditarProjetoUseCase } from '@/application/projetos/use-cases/EditarProjetoUseCase';
import { PrismaProjetosRepository } from '@/infra/database/prisma/repositories/PrismaProjetosRepository';

const editarProjetoBodySchema = z.object({
  titulo: z.string(),
  descricao: z.string(),
  tags: z.array(z.string()),
  url: z.string().url().optional(),
  urlFoto: z.string().url().optional(),
});

const editarProjetoParamsSchema = z.object({
  id: z.string(),
});

export class EditarProjetoController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = editarProjetoParamsSchema.parse(request.params);
      const { titulo, descricao, tags, url, urlFoto } = editarProjetoBodySchema.parse(request.body);
      const criadorId = request.usuario.id;

      const projetosRepository = new PrismaProjetosRepository();
      const editarProjetoUseCase = new EditarProjetoUseCase(projetosRepository);

      await editarProjetoUseCase.execute({
        projetoId: id,
        criadorId,
        titulo,
        descricao,
        tags,
        url,
        urlFoto,
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
