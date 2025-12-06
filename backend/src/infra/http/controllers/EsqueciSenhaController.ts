import { Request, Response } from 'express';
import { z } from 'zod';
import { SolicitarResetSenhaUseCase } from '@/application/usuarios/use-cases/SolicitarResetSenhaUseCase';
import { PrismaTokenVerificacaoRepository } from '../../database/prisma/repositories/PrismaTokenVerificacaoRepository';
import { PrismaUsuariosRepository } from '../../database/prisma/repositories/PrismaUsuariosRepository';
import { getEmailService } from '@/infra/email';
import { logger } from '@/infra/logger';

const esqueciSenhaBodySchema = z.object({
  email: z.string().email('Email inválido'),
});

const log = logger.child('controller:esqueci-senha');

export class EsqueciSenhaController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { email } = esqueciSenhaBodySchema.parse(request.body);

      log.info('Solicitação de reset de senha', { email });

      const usuariosRepository = new PrismaUsuariosRepository();
      const tokenVerificacaoRepository = new PrismaTokenVerificacaoRepository();
      const emailService = getEmailService();

      const useCase = new SolicitarResetSenhaUseCase(
        usuariosRepository,
        tokenVerificacaoRepository,
        emailService
      );

      const result = await useCase.execute({ email });

      log.info('Solicitação de reset processada', { email });

      return response.status(200).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.warn('Erro de validação', { issues: error.issues });
        return response.status(400).json({ message: 'Validation error.', issues: error.format() });
      }
      if (error instanceof Error) {
        log.warn('Erro ao processar solicitação de reset', { message: error.message });
        return response.status(400).json({ message: error.message });
      }
      log.error('Erro inesperado ao processar solicitação de reset', error);
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}

