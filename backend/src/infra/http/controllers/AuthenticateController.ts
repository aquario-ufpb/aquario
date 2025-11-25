import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticateUseCase } from '@/application/usuarios/use-cases/AuthenticateUseCase';
import { PrismaUsuariosRepository } from '@/infra/database/prisma/repositories/PrismaUsuariosRepository';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { logger } from '@/infra/logger';

const authenticateBodySchema = z.object({
  email: z.string().email(),
  senha: z.string(),
});

const authLogger = logger.child('controller:authenticate');

export class AuthenticateController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { email, senha } = authenticateBodySchema.parse(request.body);

      authLogger.info('Tentativa de autenticação recebida', { email });

      const usuariosRepository = new PrismaUsuariosRepository();
      const authenticateUseCase = new AuthenticateUseCase(usuariosRepository);

      const { usuario } = await authenticateUseCase.execute({ email, senha });

      authLogger.info('Usuário autenticado com sucesso', { usuarioId: usuario.id });

      const token = jwt.sign(
        {
          papel: usuario.props.papel,
          permissoes: usuario.props.permissoes,
          papelPlataforma: usuario.props.papelPlataforma,
        },
        env.JWT_SECRET,
        {
          subject: usuario.id,
          expiresIn: '1d',
        }
      );

      const refreshToken = jwt.sign(
        {
          papel: usuario.props.papel,
        },
        env.JWT_SECRET,
        {
          subject: usuario.id,
          expiresIn: '7d',
        }
      );

      // Return user without password
      const userResponse = {
        id: usuario.id,
        nome: usuario.props.nome,
        email: usuario.props.email,
        papel: usuario.props.papel,
        papelPlataforma: usuario.props.papelPlataforma,
        urlFotoPerfil: usuario.props.urlFotoPerfil,
        periodo: usuario.props.periodo,
        bio: usuario.props.bio,
      };

      return response.status(200).json({ 
        user: userResponse, 
        accessToken: token,
        refreshToken 
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        authLogger.warn('Falha de validação ao autenticar usuário', {
          issues: error.issues.map(issue => issue.message),
        });
        return response.status(400).json({ message: 'Validation error.', issues: error.format() });
      }
      if (error instanceof Error) {
        authLogger.warn('Autenticação negada', { message: error.message });
        return response.status(401).json({ message: error.message });
      }
      authLogger.error('Erro inesperado durante autenticação', error);
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
