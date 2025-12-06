import { Request, Response } from 'express';
import { ListarUsuariosUseCase } from '@/application/usuarios/use-cases/ListarUsuariosUseCase';
import { PrismaUsuariosRepository } from '@/infra/database/prisma/repositories/PrismaUsuariosRepository';

export class ListarUsuariosController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const usuariosRepository = new PrismaUsuariosRepository();
      const useCase = new ListarUsuariosUseCase(usuariosRepository);

      const { usuarios } = await useCase.execute();

      const responseData = usuarios.map(usuario => ({
        id: usuario.id,
        nome: usuario.props.nome,
        email: usuario.props.email,
        papelPlataforma: usuario.props.papelPlataforma,
        eVerificado: usuario.eVerificado,
        urlFotoPerfil: usuario.props.urlFotoPerfil,
        centro: usuario.props.centro,
        curso: usuario.props.curso,
        permissoes: usuario.props.permissoes,
      }));

      return response.status(200).json(responseData);
    } catch {
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
