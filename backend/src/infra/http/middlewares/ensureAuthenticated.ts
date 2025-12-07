import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { logger } from '@/infra/logger';

interface IPayload {
  sub: string;
  papelPlataforma?: 'USER' | 'MASTER_ADMIN';
  permissoes?: string[];
}

const authLogger = logger.child('auth:middleware');

export function ensureAuthenticated(request: Request, response: Response, next: NextFunction) {
  const authToken = request.headers.authorization;

  if (!authToken) {
    authLogger.warn('Token ausente na requisição', {
      method: request.method,
      url: request.originalUrl,
    });
    return response.status(401).json({ message: 'Token de autenticação não fornecido.' });
  }

  const [scheme, token] = authToken.split(' ');

  if (!token || scheme !== 'Bearer') {
    authLogger.warn('Token com formato inválido', {
      method: request.method,
      url: request.originalUrl,
      scheme,
    });
    return response.status(401).json({ message: 'Token de autenticação inválido.' });
  }

  try {
    const { sub, papelPlataforma } = jwt.verify(token, env.JWT_SECRET) as IPayload;

    request.usuario = {
      id: sub,
      papelPlataforma: papelPlataforma ?? 'USER',
    };

    authLogger.debug('Token validado com sucesso', {
      usuarioId: sub,
      method: request.method,
      url: request.originalUrl,
    });

    return next();
  } catch {
    authLogger.warn('Token inválido fornecido', {
      method: request.method,
      url: request.originalUrl,
    });
    return response.status(401).json({ message: 'Token inválido.' });
  }
}
