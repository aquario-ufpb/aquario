import { compare } from 'bcryptjs';
import { IUsuariosRepository } from '@/domain/usuarios/repositories/IUsuariosRepository';
import { Usuario } from '@/domain/usuarios/entities/Usuario';
import { logger } from '@/infra/logger';

interface AuthenticateUseCaseRequest {
  email: string;
  senha: string;
}

interface AuthenticateUseCaseResponse {
  usuario: Usuario;
}

export class AuthenticateUseCase {
  private readonly log = logger.child('use-case:authenticate');

  constructor(private usuariosRepository: IUsuariosRepository) {}

  async execute({
    email,
    senha,
  }: AuthenticateUseCaseRequest): Promise<AuthenticateUseCaseResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    this.log.debug('Iniciando autenticação de usuário', { email: normalizedEmail });

    const usuario = await this.usuariosRepository.findByEmail(normalizedEmail);

    if (!usuario) {
      this.log.warn('Usuário não encontrado durante autenticação', { email: normalizedEmail });
      throw new Error('E-mail ou senha inválidos.');
    }

    const senhaCorresponde = await compare(senha, usuario.props.senhaHash);

    if (!senhaCorresponde) {
      this.log.warn('Senha inválida fornecida', { usuarioId: usuario.id });
      throw new Error('E-mail ou senha inválidos.');
    }

    // Check if email is verified
    if (!usuario.eVerificado) {
      this.log.warn('Tentativa de login com email não verificado', { usuarioId: usuario.id });
      throw new Error('Email não verificado. Verifique sua caixa de entrada ou solicite um novo email de verificação.');
    }

    this.log.info('Autenticação concluída com sucesso', { usuarioId: usuario.id });
    return { usuario };
  }
}
