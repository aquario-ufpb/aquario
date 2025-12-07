import { IUsuariosRepository } from '@/domain/usuarios/repositories/IUsuariosRepository';
import { logger } from '@/infra/logger';

type DeletarUsuarioUseCaseRequest = {
  usuarioId: string;
  adminId: string;
};

type DeletarUsuarioUseCaseResponse = void;

export class DeletarUsuarioUseCase {
  private readonly log = logger.child('use-case:deletar-usuario');

  constructor(private usuariosRepository: IUsuariosRepository) {}

  async execute({
    usuarioId,
    adminId,
  }: DeletarUsuarioUseCaseRequest): Promise<DeletarUsuarioUseCaseResponse> {
    // Prevent self-deletion
    if (usuarioId === adminId) {
      this.log.warn('Tentativa de auto-deleção bloqueada', { usuarioId, adminId });
      throw new Error('Você não pode deletar sua própria conta.');
    }

    // Check if user exists
    const usuario = await this.usuariosRepository.findById(usuarioId);
    if (!usuario) {
      this.log.warn('Tentativa de deletar usuário inexistente', { usuarioId });
      throw new Error('Usuário não encontrado.');
    }

    // Delete user
    await this.usuariosRepository.delete(usuarioId);

    this.log.info('Usuário deletado com sucesso', {
      usuarioId,
      adminId,
      email: usuario.props.email,
    });
  }
}

