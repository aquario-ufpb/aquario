import { Request, Response } from 'express';
import { ListarProjetosUseCase } from '@/application/projetos/use-cases/ListarProjetosUseCase';
import { PrismaProjetosRepository } from '@/infra/database/prisma/repositories/PrismaProjetosRepository';

export class ListarProjetosController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const projetosRepository = new PrismaProjetosRepository();
      const listarProjetosUseCase = new ListarProjetosUseCase(projetosRepository);

      const projetos = await listarProjetosUseCase.execute();

      const projetosData = projetos.map(projeto => ({
        id: projeto.id,
        titulo: projeto.titulo,
        descricao: projeto.descricao,
        tipo: projeto.tipo,
        criadorId: projeto.criadorId,
        centroId: projeto.centroId,
        tags: projeto.tags,
        url: projeto.url,
        urlFoto: projeto.urlFoto,
        criadoEm: projeto.props.criadoEm,
        atualizadoEm: projeto.props.atualizadoEm,
      }));

      return response.status(200).json(projetosData);
    } catch {
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
