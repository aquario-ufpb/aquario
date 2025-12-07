import { Request, Response } from 'express';
import { ReenviarVerificacaoUseCase } from '@/application/usuarios/use-cases/ReenviarVerificacaoUseCase';
import { PrismaTokenVerificacaoRepository } from '@/infra/database/prisma/repositories/PrismaTokenVerificacaoRepository';
import { PrismaUsuariosRepository } from '@/infra/database/prisma/repositories/PrismaUsuariosRepository';
import { getEmailService } from '@/infra/email';
import { logger } from '@/infra/logger';

const log = logger.child('controller:reenviar-verificacao');

export class ReenviarVerificacaoController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const usuarioId = request.usuario.id;

      log.info('Solicitação de reenvio de verificação', { usuarioId });

      const usuariosRepository = new PrismaUsuariosRepository();
      const tokenVerificacaoRepository = new PrismaTokenVerificacaoRepository();
      const emailService = getEmailService();

      const useCase = new ReenviarVerificacaoUseCase(
        usuariosRepository,
        tokenVerificacaoRepository,
        emailService
      );

      const result = await useCase.execute({ usuarioId });

      log.info('Email de verificação reenviado', { usuarioId });

      return response.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        log.warn('Erro ao reenviar verificação', { message: error.message });
        return response.status(400).json({ message: error.message });
      }
      log.error('Erro inesperado ao reenviar verificação', error);
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}

