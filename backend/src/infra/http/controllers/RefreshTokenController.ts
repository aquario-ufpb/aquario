import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { logger } from '@/infra/logger';
import { PrismaUsuariosRepository } from '@/infra/database/prisma/repositories/PrismaUsuariosRepository';

const refreshLogger = logger.child('controller:refresh');

interface IPayload {
  sub: string;
  papelPlataforma?: string;
  permissoes?: string[];
  exp?: number;
  iat?: number;
}

export class RefreshTokenController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const authToken = request.headers.authorization;

      if (!authToken) {
        refreshLogger.warn('Token ausente na requisição de refresh');
        return response.status(401).json({ message: 'Token de autenticação não fornecido.' });
      }

      const [scheme, token] = authToken.split(' ');

      if (!token || scheme !== 'Bearer') {
        refreshLogger.warn('Token com formato inválido na requisição de refresh');
        return response.status(401).json({ message: 'Token de autenticação inválido.' });
      }

      // Verify token, but allow expired tokens (within grace period)
      let decoded: IPayload;
      try {
        // First try normal verification
        decoded = jwt.verify(token, env.JWT_SECRET) as IPayload;
      } catch (error) {
        // If expired, try with ignoreExpiration to allow grace period
        if (error instanceof jwt.TokenExpiredError) {
          refreshLogger.debug('Token expirado, tentando refresh com grace period', {
            expiredAt: error.expiredAt,
          });
          decoded = jwt.verify(token, env.JWT_SECRET, {
            ignoreExpiration: true,
          }) as IPayload;

          // Check if token expired more than 7 days ago (grace period)
          const expiredAt = error.expiredAt.getTime();
          const now = Date.now();
          const daysSinceExpiration = (now - expiredAt) / (1000 * 60 * 60 * 24);

          if (daysSinceExpiration > 7) {
            refreshLogger.warn('Token expirado há mais de 7 dias', {
              daysSinceExpiration: daysSinceExpiration.toFixed(2),
            });
            return response.status(401).json({ message: 'Token expirado há muito tempo. Faça login novamente.' });
          }
        } else {
          // Invalid token (not just expired)
          refreshLogger.warn('Token inválido na requisição de refresh', { error });
          return response.status(401).json({ message: 'Token inválido.' });
        }
      }

      // Get fresh user data from database to ensure permissions are up to date
      const usuariosRepository = new PrismaUsuariosRepository();
      const usuario = await usuariosRepository.findById(decoded.sub);

      if (!usuario) {
        refreshLogger.warn('Usuário não encontrado durante refresh', { usuarioId: decoded.sub });
        return response.status(401).json({ message: 'Usuário não encontrado.' });
      }

      // Issue new token with current user data
      const newToken = jwt.sign(
        {
          permissoes: usuario.props.permissoes,
          papelPlataforma: usuario.props.papelPlataforma,
        },
        env.JWT_SECRET,
        {
          subject: usuario.id,
          expiresIn: '1d',
        }
      );

      refreshLogger.info('Token renovado com sucesso', { usuarioId: usuario.id });

      return response.status(200).json({ token: newToken });
    } catch (error) {
      refreshLogger.error('Erro inesperado ao renovar token', error);
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}

