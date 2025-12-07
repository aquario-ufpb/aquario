import { Request, Response } from 'express';
import { z } from 'zod';
import { ResetarSenhaUseCase } from '@/application/usuarios/use-cases/ResetarSenhaUseCase';
import { PrismaTokenVerificacaoRepository } from '@/infra/database/prisma/repositories/PrismaTokenVerificacaoRepository';
import { PrismaUsuariosRepository } from '@/infra/database/prisma/repositories/PrismaUsuariosRepository';
import { logger } from '@/infra/logger';

const resetarSenhaBodySchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  novaSenha: z
    .string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres.')
    .max(128, 'A senha deve ter no máximo 128 caracteres.'),
});

const log = logger.child('controller:resetar-senha');

export class ResetarSenhaController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { token, novaSenha } = resetarSenhaBodySchema.parse(request.body);

      log.info('Tentativa de reset de senha');

      const tokenVerificacaoRepository = new PrismaTokenVerificacaoRepository();
      const usuariosRepository = new PrismaUsuariosRepository();

      const useCase = new ResetarSenhaUseCase(tokenVerificacaoRepository, usuariosRepository);

      const result = await useCase.execute({ token, novaSenha });

      log.info('Senha resetada com sucesso');

      return response.status(200).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.warn('Erro de validação', { issues: error.issues });
        return response.status(400).json({ message: 'Validation error.', issues: error.format() });
      }
      if (error instanceof Error) {
        log.warn('Erro ao resetar senha', { message: error.message });
        return response.status(400).json({ message: error.message });
      }
      log.error('Erro inesperado ao resetar senha', error);
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}

