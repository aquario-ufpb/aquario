import { Request, Response } from 'express';
import { ListarVagasUseCase } from '@/application/vagas/use-cases/ListarVagasUseCase';
import { PrismaVagasRepository } from '@/infra/database/prisma/repositories/PrismaVagasRepository';

export class ListarVagasController {
  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const vagasRepository = new PrismaVagasRepository();
      const listarVagasUseCase = new ListarVagasUseCase(vagasRepository);

      const vagas = await listarVagasUseCase.execute();

      const vagasData = vagas.map(vaga => ({
        id: vaga.id,
        titulo: vaga.titulo,
        descricao: vaga.descricao,
        tipoVaga: vaga.tipoVaga,
        publicador: vaga.publicador,
        centroId: vaga.centroId,
        eAtiva: vaga.eAtiva,
        criadoEm: vaga.criadoEm,
        atualizadoEm: vaga.atualizadoEm,
      }));

      return response.status(200).json(vagasData);
    } catch {
      return response.status(500).json({ message: 'Internal server error.' });
    }
  }
}
