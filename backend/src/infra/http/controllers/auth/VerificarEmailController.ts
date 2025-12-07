import { Request, Response } from 'express';
import { z } from 'zod';
import { VerificarEmailUseCase } from '@/application/usuarios/use-cases/VerificarEmailUseCase';
import { PrismaTokenVerificacaoRepository } from '@/infra/database/prisma/repositories/PrismaTokenVerificacaoRepository';
import { PrismaUsuariosRepository } from '@/infra/database/prisma/repositories/PrismaUsuariosRepository';
import { logger } from '@/infra/logger';

const verificarEmailBodySchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
});

const log = logger.child('controller:verificar-email');

export class VerificarEmailController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { token } = verificarEmailBodySchema.parse(request.body);

      log.info('Tentativa de verificação de email');

      const tokenVerificacaoRepository = new PrismaTokenVerificacaoRepository();
      const usuariosRepository = new PrismaUsuariosRepository();

      const useCase = new VerificarEmailUseCase(tokenVerificacaoRepository, usuariosRepository);

      const result = await useCase.execute({ token });

      log.info('Email verificado com sucesso');

      return response.status(200).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.warn('Erro de validação', { issues: error.issues });
        return response.status(400).json({ message: 'Validation error.', issues: error.format() });
      }
      if (error instanceof Error) {
        log.warn('Erro ao verificar email', { message: error.message });
        return response.status(400).json({ message: error.message });
      }
      log.error('Erro inesperado ao verificar email', error);
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}

