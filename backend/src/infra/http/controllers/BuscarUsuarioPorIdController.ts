import { Request, Response } from 'express';
import { z } from 'zod';
import { BuscarUsuarioPorIdUseCase } from '@/application/usuarios/use-cases/BuscarUsuarioPorIdUseCase';
import { PrismaUsuariosRepository } from '@/infra/database/prisma/repositories/PrismaUsuariosRepository';

const paramsSchema = z.object({ id: z.string().uuid() });

export class BuscarUsuarioPorIdController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const { id } = paramsSchema.parse(request.params);

      const usuariosRepository = new PrismaUsuariosRepository();
      const useCase = new BuscarUsuarioPorIdUseCase(usuariosRepository);

      const { usuario } = await useCase.execute({ id });

      if (!usuario) {
        return response.status(404).json({ message: 'Usuário não encontrado.' });
      }

      const responseData = {
        id: usuario.id,
        nome: usuario.props.nome,
        email: usuario.props.email,
        urlFotoPerfil: usuario.props.urlFotoPerfil,
        centro: usuario.props.centro,
        curso: usuario.props.curso,
      };

      return response.status(200).json(responseData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return response.status(400).json({ message: 'Validation error.', issues: error.format() });
      }
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
