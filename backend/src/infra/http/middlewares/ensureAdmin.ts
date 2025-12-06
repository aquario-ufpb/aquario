import { Request, Response, NextFunction } from 'express';
import { PrismaUsuariosRepository } from '../../database/prisma/repositories/PrismaUsuariosRepository';
import { logger } from '@/infra/logger';

const log = logger.child('middleware:ensure-admin');

export async function ensureAdmin(request: Request, response: Response, next: NextFunction) {
  const { id } = request.usuario;

  const usuariosRepository = new PrismaUsuariosRepository();
  const usuario = await usuariosRepository.findById(id);

  if (!usuario) {
    log.warn('Usuário não encontrado', { id });
    return response.status(404).json({ message: 'Usuário não encontrado.' });
  }

  const isAdmin =
    usuario.props.permissoes.includes('ADMIN') || usuario.props.papelPlataforma === 'MASTER_ADMIN';

  if (!isAdmin) {
    log.warn('Acesso negado - usuário não é admin', { id });
    return response.status(403).json({ message: 'Ação não autorizada.' });
  }

  log.debug('Acesso admin autorizado', { id });
  return next();
}

