import { Request, Response } from 'express';
import { z } from 'zod';
import { SolicitarReenvioVerificacaoUseCase } from '@/application/usuarios/use-cases/SolicitarReenvioVerificacaoUseCase';
import { PrismaTokenVerificacaoRepository } from '../../database/prisma/repositories/PrismaTokenVerificacaoRepository';
import { PrismaUsuariosRepository } from '../../database/prisma/repositories/PrismaUsuariosRepository';
import { getEmailService } from '@/infra/email';
import { logger } from '@/infra/logger';

const log = logger.child('controller:solicitar-reenvio-verificacao');

const requestSchema = z.object({
  email: z.string().email('Email inválido'),
});

export class SolicitarReenvioVerificacaoController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const body = requestSchema.parse(request.body);
      const { email } = body;

      log.info('Solicitação de reenvio de verificação por email', { email });

      const usuariosRepository = new PrismaUsuariosRepository();
      const tokenVerificacaoRepository = new PrismaTokenVerificacaoRepository();
      const emailService = getEmailService();

      const useCase = new SolicitarReenvioVerificacaoUseCase(
        usuariosRepository,
        tokenVerificacaoRepository,
        emailService
      );

      const result = await useCase.execute({ email });

      log.info('Solicitação de reenvio processada', { email });

      return response.status(200).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.warn('Erro de validação ao solicitar reenvio', { errors: error.errors });
        return response.status(400).json({
          message: 'Dados inválidos',
          errors: error.errors,
        });
      }
      if (error instanceof Error) {
        log.warn('Erro ao solicitar reenvio', { message: error.message });
        return response.status(400).json({ message: error.message });
      }
      log.error('Erro inesperado ao solicitar reenvio', error);
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}

