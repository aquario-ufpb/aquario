import { Request, Response } from 'express';
import { z } from 'zod';
import { RegisterUseCase } from '@/application/usuarios/use-cases/RegisterUseCase';
import { PrismaUsuariosRepository } from '../../database/prisma/repositories/PrismaUsuariosRepository';
import { PrismaCentrosRepository } from '../../database/prisma/repositories/PrismaCentrosRepository';
import { PrismaCursosRepository } from '../../database/prisma/repositories/PrismaCursosRepository';
import { PrismaTokenVerificacaoRepository } from '../../database/prisma/repositories/PrismaTokenVerificacaoRepository';
import { getEmailService } from '@/infra/email';
import { logger } from '@/infra/logger';

const registerBodySchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  senha: z
    .string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres.')
    .max(128, 'A senha deve ter no máximo 128 caracteres.'),
  centroId: z.string().uuid(),
  cursoId: z.string().uuid(),
  bio: z.string().optional(),
  urlFotoPerfil: z.string().url().optional(),
});

const registerLogger = logger.child('controller:register');

export class RegisterController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { nome, email, senha, centroId, cursoId, bio, urlFotoPerfil } =
        registerBodySchema.parse(request.body);

      registerLogger.info('Tentativa de registro recebida', {
        email,
        centroId,
        cursoId,
      });

      const usuariosRepository = new PrismaUsuariosRepository();
      const centrosRepository = new PrismaCentrosRepository();
      const cursosRepository = new PrismaCursosRepository();
      const tokenVerificacaoRepository = new PrismaTokenVerificacaoRepository();
      const emailService = getEmailService();

      const registerUseCase = new RegisterUseCase(
        usuariosRepository,
        centrosRepository,
        cursosRepository,
        tokenVerificacaoRepository,
        emailService
      );

      const { usuarioId, autoVerificado } = await registerUseCase.execute({
        nome,
        email,
        senha,
        centroId,
        cursoId,
        bio,
        urlFotoPerfil,
      });

      registerLogger.info('Usuário registrado com sucesso', { email, usuarioId, autoVerificado });

      const message = autoVerificado
        ? 'Usuário registrado com sucesso. Você já pode fazer login.'
        : 'Usuário registrado com sucesso. Verifique seu email para ativar sua conta.';

      return response.status(201).json({
        message,
        usuarioId,
        verificado: autoVerificado,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        registerLogger.warn('Falha de validação no registro de usuário', {
          email: request.body?.email,
          issues: error.issues.map(issue => issue.message),
        });
        return response.status(400).json({ message: 'Validation error.', issues: error.format() });
      }
      if (error instanceof Error) {
        registerLogger.warn('Erro de negócio ao registrar usuário', { message: error.message });
        return response.status(409).json({ message: error.message });
      }
      registerLogger.error('Erro inesperado ao registrar usuário', error);
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
