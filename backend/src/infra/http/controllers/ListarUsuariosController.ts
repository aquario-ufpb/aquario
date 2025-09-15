import { Request, Response } from 'express';
import { ListarUsuariosUseCase } from '@/application/usuarios/use-cases/ListarUsuariosUseCase';
import { PrismaUsuariosRepository } from '@/infra/database/prisma/repositories/PrismaUsuariosRepository';

export class ListarUsuariosController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const usuariosRepository = new PrismaUsuariosRepository();
      const useCase = new ListarUsuariosUseCase(usuariosRepository);

      const { usuarios } = await useCase.execute();

      const responseData = usuarios.map((usuario) => ({
        id: usuario.id,
        nome: usuario.props.nome,
        email: usuario.props.email,
        papel: usuario.props.papel,
        urlFotoPerfil: usuario.props.urlFotoPerfil,
        bio: usuario.props.bio,
        periodo: usuario.props.periodo,
        centro: usuario.props.centro,
        curso: usuario.props.curso,
      }));

      return response.status(200).json(responseData);
    } catch (error) {
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
