import { Request, Response } from 'express';
import { PrismaUsuariosRepository } from '../../database/prisma/repositories/PrismaUsuariosRepository';

export class MeuPerfilController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const criadorId = request.usuario.id;

      const usuariosRepository = new PrismaUsuariosRepository();
      const usuario = await usuariosRepository.findById(criadorId);

      if (!usuario) {
        return response.status(404).json({ message: 'Usuário não encontrado.' });
      }

      const { senhaHash, ...usuarioSemSenha } = usuario.props;

      return response.status(200).json(usuarioSemSenha);
    } catch (error) {
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
