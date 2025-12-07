import { Request, Response } from 'express';
import { z } from 'zod';
import { EditarVagaUseCase } from '@/application/vagas/use-cases/EditarVagaUseCase';
import { PrismaVagasRepository } from '@/infra/database/prisma/repositories/PrismaVagasRepository';
import { TipoVaga } from '@prisma/client';

const editarVagaBodySchema = z.object({
  titulo: z.string(),
  descricao: z.string(),
  tipoVaga: z.nativeEnum(TipoVaga),
  eAtiva: z.boolean(),
});

const editarVagaParamsSchema = z.object({
  id: z.string(),
});

export class EditarVagaController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = editarVagaParamsSchema.parse(request.params);
      const { titulo, descricao, tipoVaga, eAtiva } = editarVagaBodySchema.parse(request.body);
      const publicadorId = request.usuario.id;

      const vagasRepository = new PrismaVagasRepository();
      const editarVagaUseCase = new EditarVagaUseCase(vagasRepository);

      await editarVagaUseCase.execute({
        vagaId: id,
        publicadorId,
        titulo,
        descricao,
        tipoVaga,
        eAtiva,
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
        if (error.message === 'Vaga não encontrada.' || error.message === 'Ação não autorizada.') {
          return response.status(403).json({ message: error.message });
        }
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
