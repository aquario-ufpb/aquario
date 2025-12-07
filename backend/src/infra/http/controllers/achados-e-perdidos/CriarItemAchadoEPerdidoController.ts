import { Request, Response } from 'express';
import { z } from 'zod';
import { CriarItemAchadoEPerdidoUseCase } from '@/application/achados-e-perdidos/use-cases/CriarItemAchadoEPerdidoUseCase';
import { PrismaItensAchadosEPerdidosRepository } from '@/infra/database/prisma/repositories/PrismaItensAchadosEPerdidosRepository';
import { PrismaUsuariosRepository } from '@/infra/database/prisma/repositories/PrismaUsuariosRepository';

const criarItemAchadoEPerdidoBodySchema = z.object({
  titulo: z.string(),
  descricao: z.string(),
  urlsFotos: z.array(z.string().url()).optional(),
});

export class CriarItemAchadoEPerdidoController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { titulo, descricao, urlsFotos } = criarItemAchadoEPerdidoBodySchema.parse(
        request.body
      );
      const autorId = request.usuario.id;

      const itensRepository = new PrismaItensAchadosEPerdidosRepository();
      const usuariosRepository = new PrismaUsuariosRepository();
      const criarItemUseCase = new CriarItemAchadoEPerdidoUseCase(
        itensRepository,
        usuariosRepository
      );

      await criarItemUseCase.execute({ titulo, descricao, autorId, urlsFotos });

      return response.status(201).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.status(400).json({
          message: 'Validation error.',
          issues: error.format(),
        });
      }
      if (error instanceof Error) {
        return response.status(403).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
