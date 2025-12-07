import { Request, Response } from 'express';
import { z } from 'zod';
import { DeletarItemAchadoEPerdidoUseCase } from '@/application/achados-e-perdidos/use-cases/DeletarItemAchadoEPerdidoUseCase';
import { PrismaItensAchadosEPerdidosRepository } from '@/infra/database/prisma/repositories/PrismaItensAchadosEPerdidosRepository';
import { PrismaUsuariosRepository } from '@/infra/database/prisma/repositories/PrismaUsuariosRepository';

const deletarItemParamsSchema = z.object({ id: z.string() });

export class DeletarItemAchadoEPerdidoController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = deletarItemParamsSchema.parse(request.params);
      const usuarioId = request.usuario.id;

      const itensRepository = new PrismaItensAchadosEPerdidosRepository();
      const usuariosRepository = new PrismaUsuariosRepository();
      const deletarItemUseCase = new DeletarItemAchadoEPerdidoUseCase(
        itensRepository,
        usuariosRepository
      );

      await deletarItemUseCase.execute({ itemId: id, usuarioId });

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
