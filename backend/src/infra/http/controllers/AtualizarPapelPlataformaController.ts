import { Request, Response } from 'express';
import { z } from 'zod';
import { AtualizarPapelPlataformaUseCase } from '@/application/usuarios/use-cases/AtualizarPapelPlataformaUseCase';
import { PrismaUsuariosRepository } from '@/infra/database/prisma/repositories/PrismaUsuariosRepository';
import { logger } from '@/infra/logger';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  papelPlataforma: z.enum(['USER', 'MASTER_ADMIN']),
});

const controllerLogger = logger.child('controller:atualizar-papel-plataforma');

export class AtualizarPapelPlataformaController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = paramsSchema.parse(request.params);
      const { papelPlataforma } = bodySchema.parse(request.body);

      controllerLogger.info('Tentativa de atualização de papel', {
        usuarioId: id,
        papelPlataforma,
        atualizadoPor: request.usuario.id,
      });

      const usuariosRepository = new PrismaUsuariosRepository();
      const useCase = new AtualizarPapelPlataformaUseCase(usuariosRepository);

      const _result = await useCase.execute({
        usuarioId: id,
        papelPlataforma,
      });

      // Fetch updated user to return complete data
      const usuario = await usuariosRepository.findById(id);
      if (!usuario) {
        return response.status(404).json({ message: 'Usuário não encontrado.' });
      }

      controllerLogger.info('Papel atualizado com sucesso', {
        usuarioId: id,
        papelPlataforma,
      });

      return response.status(200).json({
        id: usuario.id,
        nome: usuario.props.nome,
        email: usuario.props.email,
        papelPlataforma: usuario.props.papelPlataforma,
        eVerificado: usuario.eVerificado,
        urlFotoPerfil: usuario.props.urlFotoPerfil,
        centro: usuario.props.centro,
        curso: usuario.props.curso,
        permissoes: usuario.props.permissoes,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        controllerLogger.warn('Falha de validação ao atualizar papel', {
          issues: error.issues.map(issue => issue.message),
        });
        return response.status(400).json({ message: 'Validation error.', issues: error.format() });
      }
      if (error instanceof Error) {
        controllerLogger.warn('Erro ao atualizar papel', { message: error.message });
        return response.status(404).json({ message: error.message });
      }
      controllerLogger.error('Erro inesperado ao atualizar papel', error);
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
