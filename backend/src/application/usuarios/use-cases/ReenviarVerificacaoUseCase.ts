import { randomBytes } from 'crypto';
import { ITokenVerificacaoRepository } from '@/domain/usuarios/repositories/ITokenVerificacaoRepository';
import { IUsuariosRepository } from '@/domain/usuarios/repositories/IUsuariosRepository';
import { TokenVerificacao } from '@/domain/usuarios/entities/TokenVerificacao';
import type { IEmailService } from '@/infra/email';
import { logger } from '@/infra/logger';

interface ReenviarVerificacaoUseCaseRequest {
  usuarioId: string;
}

interface ReenviarVerificacaoUseCaseResponse {
  success: boolean;
  message: string;
}

export class ReenviarVerificacaoUseCase {
  private readonly log = logger.child('use-case:reenviar-verificacao');

  constructor(
    private usuariosRepository: IUsuariosRepository,
    private tokenVerificacaoRepository: ITokenVerificacaoRepository,
    private emailService: IEmailService
  ) {}

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  async execute({
    usuarioId,
  }: ReenviarVerificacaoUseCaseRequest): Promise<ReenviarVerificacaoUseCaseResponse> {
    this.log.debug('Reenviando email de verificação', { usuarioId });

    // Find the user
    const usuario = await this.usuariosRepository.findById(usuarioId);

    if (!usuario) {
      this.log.warn('Usuário não encontrado', { usuarioId });
      throw new Error('Usuário não encontrado.');
    }

    // Check if already verified
    if (usuario.props.eVerificado) {
      this.log.info('Email já verificado', { usuarioId });
      return {
        success: true,
        message: 'Seu email já está verificado.',
      };
    }

    // Check for rate limiting - don't send if last token was created less than 1 minute ago
    const lastToken = await this.tokenVerificacaoRepository.findLatestByUsuarioIdAndTipo(
      usuarioId,
      'VERIFICACAO_EMAIL'
    );

    if (lastToken && lastToken.criadoEm) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      if (lastToken.criadoEm > oneMinuteAgo) {
        this.log.warn('Tentativa de reenvio muito frequente', { usuarioId });
        throw new Error('Aguarde pelo menos 1 minuto antes de solicitar outro email.');
      }
    }

    // Delete old verification tokens for this user
    await this.tokenVerificacaoRepository.deleteByUsuarioIdAndTipo(usuarioId, 'VERIFICACAO_EMAIL');

    // Generate and save new token
    const tokenValue = this.generateToken();
    const token = TokenVerificacao.createVerificationToken(usuarioId, tokenValue);
    await this.tokenVerificacaoRepository.create(token);

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        usuario.props.email,
        tokenValue,
        usuario.props.nome
      );
      this.log.info('Email de verificação reenviado', { usuarioId });
    } catch (error) {
      this.log.error('Falha ao enviar email de verificação', { usuarioId, error });
      throw new Error('Falha ao enviar email. Tente novamente mais tarde.');
    }

    return {
      success: true,
      message: 'Email de verificação enviado. Verifique sua caixa de entrada.',
    };
  }
}

