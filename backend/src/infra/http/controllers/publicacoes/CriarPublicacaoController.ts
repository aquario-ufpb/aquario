import { Request, Response } from 'express';
import { z } from 'zod';
import { CriarPublicacaoUseCase } from '@/application/publicacoes/use-cases/CriarPublicacaoUseCase';
import { PrismaPublicacoesRepository } from '@/infra/database/prisma/repositories/PrismaPublicacoesRepository';
import { PrismaUsuariosRepository } from '@/infra/database/prisma/repositories/PrismaUsuariosRepository';
import { PrismaCentrosRepository } from '@/infra/database/prisma/repositories/PrismaCentrosRepository';

const criarPublicacaoBodySchema = z.object({
  titulo: z.string(),
  conteudo: z.string(),
  centroId: z.string(),
});

export class CriarPublicacaoController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { titulo, conteudo, centroId } = criarPublicacaoBodySchema.parse(request.body);
      const autorId = request.usuario.id;

      const publicacoesRepository = new PrismaPublicacoesRepository();
      const usuariosRepository = new PrismaUsuariosRepository();
      const centrosRepository = new PrismaCentrosRepository();
      const criarPublicacaoUseCase = new CriarPublicacaoUseCase(
        publicacoesRepository,
        usuariosRepository,
        centrosRepository
      );

      await criarPublicacaoUseCase.execute({
        autorId,
        centroId,
        titulo,
        conteudo,
      });

      return response.status(201).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.status(400).json({
          message: 'Validation error.',
          issues: error.format(),
        });
      }
      if (error instanceof Error) {
        if (
          error.message === 'Autor não encontrado.' ||
          error.message === 'Centro não encontrado.'
        ) {
          return response.status(404).json({ message: error.message });
        }
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
