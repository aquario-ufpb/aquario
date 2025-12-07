import { Request, Response } from 'express';
import { z } from 'zod';
import { CriarVagaUseCase } from '@/application/vagas/use-cases/CriarVagaUseCase';
import { PrismaVagasRepository } from '@/infra/database/prisma/repositories/PrismaVagasRepository';
import { PrismaUsuariosRepository } from '@/infra/database/prisma/repositories/PrismaUsuariosRepository';
import { PrismaCentrosRepository } from '@/infra/database/prisma/repositories/PrismaCentrosRepository';
import { TipoVaga } from '@prisma/client';

const criarVagaBodySchema = z.object({
  titulo: z.string(),
  descricao: z.string(),
  tipoVaga: z.nativeEnum(TipoVaga),
  centroId: z.string().uuid(),
});

export class CriarVagaController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { titulo, descricao, tipoVaga, centroId } = criarVagaBodySchema.parse(request.body);
      const publicadorId = request.usuario.id;

      const vagasRepository = new PrismaVagasRepository();
      const usuariosRepository = new PrismaUsuariosRepository();
      const centrosRepository = new PrismaCentrosRepository();
      const criarVagaUseCase = new CriarVagaUseCase(
        vagasRepository,
        usuariosRepository,
        centrosRepository
      );

      await criarVagaUseCase.execute({
        titulo,
        descricao,
        tipoVaga,
        publicadorId,
        centroId,
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
          error.message === 'Publicador não encontrado.' ||
          error.message === 'Centro não encontrado.'
        ) {
          return response.status(404).json({ message: error.message });
        }
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
