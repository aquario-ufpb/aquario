import { IUsuariosRepository } from '@/domain/usuarios/repositories/IUsuariosRepository';
import { logger } from '@/infra/logger';

interface AtualizarPapelPlataformaUseCaseRequest {
  usuarioId: string;
  papelPlataforma: 'USER' | 'MASTER_ADMIN';
}

interface AtualizarPapelPlataformaUseCaseResponse {
  usuarioId: string;
  papelPlataforma: 'USER' | 'MASTER_ADMIN';
}

export class AtualizarPapelPlataformaUseCase {
  private readonly log = logger.child('use-case:atualizar-papel-plataforma');

  constructor(private usuariosRepository: IUsuariosRepository) {}

  async execute({
    usuarioId,
    papelPlataforma,
  }: AtualizarPapelPlataformaUseCaseRequest): Promise<AtualizarPapelPlataformaUseCaseResponse> {
    this.log.debug('Iniciando atualização de papel', { usuarioId, papelPlataforma });

    // Check if user exists
    const usuario = await this.usuariosRepository.findById(usuarioId);
    if (!usuario) {
      this.log.warn('Usuário não encontrado', { usuarioId });
      throw new Error('Usuário não encontrado.');
    }

    // Update role
    await this.usuariosRepository.updatePapelPlataforma(usuarioId, papelPlataforma);

    this.log.info('Papel atualizado com sucesso', { usuarioId, papelPlataforma });

    return { usuarioId, papelPlataforma };
  }
}
