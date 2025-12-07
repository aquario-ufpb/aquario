import { Request, Response } from 'express';
import { z } from 'zod';
import { AtualizarStatusItemAchadoEPerdidoUseCase } from '@/application/achados-e-perdidos/use-cases/AtualizarStatusItemAchadoEPerdidoUseCase';
import { PrismaItensAchadosEPerdidosRepository } from '@/infra/database/prisma/repositories/PrismaItensAchadosEPerdidosRepository';
import { PrismaUsuariosRepository } from '@/infra/database/prisma/repositories/PrismaUsuariosRepository';
import { StatusItemAchadoEPerdido } from '@prisma/client';

const atualizarStatusParamsSchema = z.object({ id: z.string() });
const atualizarStatusBodySchema = z.object({
  titulo: z.string().optional(),
  descricao: z.string().optional(),
  status: z.nativeEnum(StatusItemAchadoEPerdido).optional(),
});

export class AtualizarStatusItemAchadoEPerdidoController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = atualizarStatusParamsSchema.parse(request.params);
      const { titulo, descricao, status } = atualizarStatusBodySchema.parse(request.body);
      const usuarioId = request.usuario.id;

      const itensRepository = new PrismaItensAchadosEPerdidosRepository();
      const usuariosRepository = new PrismaUsuariosRepository();
      const atualizarStatusUseCase = new AtualizarStatusItemAchadoEPerdidoUseCase(
        itensRepository,
        usuariosRepository
      );

      await atualizarStatusUseCase.execute({ itemId: id, usuarioId, titulo, descricao, status });

      return response.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.status(400).json({ message: 'Validation error.', issues: error.format() });
      }
      if (error instanceof Error) {
        return response.status(403).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
