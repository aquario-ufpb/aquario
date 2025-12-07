import { Request, Response } from 'express';
import { z } from 'zod';
import { DeletarUsuarioUseCase } from '@/application/usuarios/use-cases/DeletarUsuarioUseCase';
import { PrismaUsuariosRepository } from '@/infra/database/prisma/repositories/PrismaUsuariosRepository';
import { logger } from '@/infra/logger';

const deletarUsuarioParamsSchema = z.object({
  id: z.string(),
});

const deleteLogger = logger.child('controller:deletar-usuario');

export class DeletarUsuarioController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = deletarUsuarioParamsSchema.parse(request.params);
      const adminId = request.usuario.id;

      deleteLogger.info('Requisição de deleção de usuário recebida', {
        usuarioId: id,
        adminId,
      });

      const usuariosRepository = new PrismaUsuariosRepository();
      const deletarUsuarioUseCase = new DeletarUsuarioUseCase(usuariosRepository);

      await deletarUsuarioUseCase.execute({ usuarioId: id, adminId });

      return response.status(204).send();
    } catch (error) {
      if (error instanceof z.ZodError) {
        deleteLogger.warn('Falha de validação ao deletar usuário', {
          issues: error.issues.map(issue => issue.message),
        });
        return response.status(400).json({ message: 'Validation error.', issues: error.format() });
      }
      if (error instanceof Error) {
        deleteLogger.warn('Falha ao deletar usuário', { message: error.message });
        if (error.message === 'Você não pode deletar sua própria conta.') {
          return response.status(403).json({ message: error.message });
        }
        if (error.message === 'Usuário não encontrado.') {
          return response.status(404).json({ message: error.message });
        }
        return response.status(500).json({ message: error.message });
      }
      deleteLogger.error('Erro inesperado ao deletar usuário', error);
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}

