import { ITokenVerificacaoRepository } from '@/domain/usuarios/repositories/ITokenVerificacaoRepository';
import { IUsuariosRepository } from '@/domain/usuarios/repositories/IUsuariosRepository';
import { logger } from '@/infra/logger';

interface VerificarEmailUseCaseRequest {
  token: string;
}

interface VerificarEmailUseCaseResponse {
  success: boolean;
  message: string;
}

export class VerificarEmailUseCase {
  private readonly log = logger.child('use-case:verificar-email');

  constructor(
    private tokenVerificacaoRepository: ITokenVerificacaoRepository,
    private usuariosRepository: IUsuariosRepository
  ) {}

  async execute({ token }: VerificarEmailUseCaseRequest): Promise<VerificarEmailUseCaseResponse> {
    this.log.debug('Verificando token de email', { token: token.substring(0, 8) + '...' });

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
        throw new Error('Token expirado. Solicite um novo email de verificação.');
      }
      if (tokenVerificacao.isUsed()) {
        this.log.warn('Token já utilizado', { tokenId: tokenVerificacao.id });
        throw new Error('Este link já foi utilizado.');
      }
    }

    // Check if it's the correct token type
    if (tokenVerificacao.tipo !== 'VERIFICACAO_EMAIL') {
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

    // Check if already verified
    if (usuario.props.eVerificado) {
      this.log.info('Email já verificado', { usuarioId: usuario.id });
      return {
        success: true,
        message: 'Email já verificado anteriormente.',
      };
    }

    // Mark user as verified
    await this.usuariosRepository.markAsVerified(usuario.id);

    // Mark token as used
    await this.tokenVerificacaoRepository.markAsUsed(tokenVerificacao.id);

    this.log.info('Email verificado com sucesso', { usuarioId: usuario.id });

    return {
      success: true,
      message: 'Email verificado com sucesso! Você já pode fazer login.',
    };
  }
}

