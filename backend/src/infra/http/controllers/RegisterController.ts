import { Request, Response } from 'express';
import { z } from 'zod';
import { RegisterUseCase } from '@/application/usuarios/use-cases/RegisterUseCase';
import { PrismaUsuariosRepository } from '../../database/prisma/repositories/PrismaUsuariosRepository';
import { PrismaCentrosRepository } from '../../database/prisma/repositories/PrismaCentrosRepository';
import { PrismaCursosRepository } from '../../database/prisma/repositories/PrismaCursosRepository';
import { PapelUsuario } from '@prisma/client';
import { logger } from '@/infra/logger';

const registerBodySchema = z.object({
  nome: z.string(),
  email: z.string().email(),
  senha: z
    .string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres.')
    .max(128, 'A senha deve ter no máximo 128 caracteres.'),
  papel: z.nativeEnum(PapelUsuario),
  centroId: z.string().uuid(),
  bio: z.string().optional(),
  urlFotoPerfil: z.string().url().optional(),
  cursoId: z.string().uuid().optional(),
  periodo: z.number().optional(),
});

const registerLogger = logger.child('controller:register');

export class RegisterController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { nome, email, senha, papel, centroId, bio, urlFotoPerfil, cursoId, periodo } =
        registerBodySchema.parse(request.body);

      registerLogger.info('Tentativa de registro recebida', {
        email,
        papel,
        centroId,
        cursoId,
      });

      const usuariosRepository = new PrismaUsuariosRepository();
      const centrosRepository = new PrismaCentrosRepository();
      const cursosRepository = new PrismaCursosRepository();
      const registerUseCase = new RegisterUseCase(
        usuariosRepository,
        centrosRepository,
        cursosRepository
      );

      const { usuario } = await registerUseCase.execute({
        nome,
        email,
        senha,
        papel,
        centroId,
        bio,
        urlFotoPerfil,
        cursoId,
        periodo,
      });

      registerLogger.info('Usuário registrado com sucesso', { email });

      // Generate tokens for auto-login
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

      return response.status(201).json({
        user: userResponse,
        accessToken: token,
        refreshToken,
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
