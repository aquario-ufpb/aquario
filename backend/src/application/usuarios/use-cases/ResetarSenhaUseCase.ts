import { hash } from 'bcryptjs';
import { ITokenVerificacaoRepository } from '@/domain/usuarios/repositories/ITokenVerificacaoRepository';
import { IUsuariosRepository } from '@/domain/usuarios/repositories/IUsuariosRepository';
import { logger } from '@/infra/logger';

interface ResetarSenhaUseCaseRequest {
  token: string;
  novaSenha: string;
}

interface ResetarSenhaUseCaseResponse {
  success: boolean;
  message: string;
}

export class ResetarSenhaUseCase {
  private readonly log = logger.child('use-case:resetar-senha');

  constructor(
    private tokenVerificacaoRepository: ITokenVerificacaoRepository,
    private usuariosRepository: IUsuariosRepository
  ) {}

  async execute({
    token,
    novaSenha,
  }: ResetarSenhaUseCaseRequest): Promise<ResetarSenhaUseCaseResponse> {
    this.log.debug('Tentativa de reset de senha', { token: token.substring(0, 8) + '...' });

    // Validate password
    if (novaSenha.length < 8) {
      throw new Error('A senha deve ter pelo menos 8 caracteres.');
    }

    if (novaSenha.length > 128) {
      throw new Error('A senha deve ter no máximo 128 caracteres.');
    }

    // Find the token
    const tokenVerificacao = await this.tokenVerificacaoRepository.findByToken(token);

    if (!tokenVerificacao) {
      this.log.warn('Token não encontrado');
      throw new Error('Token inválido ou expirado.');
    }

    // Check if token is valid
    if (!tokenVerificacao.isValid()) {
      if (tokenVerificacao.isExpired()) {
        this.log.warn('Token expirado', { tokenId: tokenVerificacao.id });
        throw new Error('Token expirado. Solicite um novo link de redefinição de senha.');
      }
      if (tokenVerificacao.isUsed()) {
        this.log.warn('Token já utilizado', { tokenId: tokenVerificacao.id });
        throw new Error('Este link já foi utilizado.');
      }
    }

    // Check if it's the correct token type
    if (tokenVerificacao.tipo !== 'RESET_SENHA') {
      this.log.warn('Tipo de token incorreto', { tipo: tokenVerificacao.tipo });
      throw new Error('Token inválido.');
    }

    // Find the user
    const usuario = await this.usuariosRepository.findById(tokenVerificacao.usuarioId);

    if (!usuario) {
      this.log.error('Usuário não encontrado para token válido', {
        usuarioId: tokenVerificacao.usuarioId,
      });
      throw new Error('Usuário não encontrado.');
    }

    // Hash the new password
    const senhaHash = await hash(novaSenha, 10);

    // Update user's password
    await this.usuariosRepository.updatePassword(usuario.id, senhaHash);

    // Mark token as used
    await this.tokenVerificacaoRepository.markAsUsed(tokenVerificacao.id);

    this.log.info('Senha redefinida com sucesso', { usuarioId: usuario.id });

    return {
      success: true,
      message: 'Senha redefinida com sucesso! Você já pode fazer login.',
    };
  }
}

