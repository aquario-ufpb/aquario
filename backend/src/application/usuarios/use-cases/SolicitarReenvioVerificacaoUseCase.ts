import { randomBytes } from 'crypto';
import { ITokenVerificacaoRepository } from '@/domain/usuarios/repositories/ITokenVerificacaoRepository';
import { IUsuariosRepository } from '@/domain/usuarios/repositories/IUsuariosRepository';
import { TokenVerificacao } from '@/domain/usuarios/entities/TokenVerificacao';
import type { IEmailService } from '@/infra/email';
import { logger } from '@/infra/logger';

interface SolicitarReenvioVerificacaoUseCaseRequest {
  email: string;
}

interface SolicitarReenvioVerificacaoUseCaseResponse {
  success: boolean;
  message: string;
}

export class SolicitarReenvioVerificacaoUseCase {
  private readonly log = logger.child('use-case:solicitar-reenvio-verificacao');

  constructor(
    private usuariosRepository: IUsuariosRepository,
    private tokenVerificacaoRepository: ITokenVerificacaoRepository,
    private emailService: IEmailService
  ) {}

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  async execute({
    email,
  }: SolicitarReenvioVerificacaoUseCaseRequest): Promise<SolicitarReenvioVerificacaoUseCaseResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    this.log.debug('Solicitação de reenvio de verificação por email', { email: normalizedEmail });

    // Always return success to prevent email enumeration attacks
    const successResponse: SolicitarReenvioVerificacaoUseCaseResponse = {
      success: true,
      message:
        'Se o email estiver cadastrado e não verificado, você receberá um novo email de verificação.',
    };

    // Find the user
    const usuario = await this.usuariosRepository.findByEmail(normalizedEmail);

    if (!usuario) {
      // Don't reveal that user doesn't exist
      this.log.debug('Email não encontrado, retornando sucesso silencioso', {
        email: normalizedEmail,
      });
      return successResponse;
    }

    // Check if already verified
    if (usuario.props.eVerificado) {
      this.log.info('Email já verificado', { usuarioId: usuario.id });
      // Still return success to prevent information leakage
      return successResponse;
    }

    // Check for rate limiting - don't send if last token was created less than 1 minute ago
    const lastToken = await this.tokenVerificacaoRepository.findLatestByUsuarioIdAndTipo(
      usuario.id,
      'VERIFICACAO_EMAIL'
    );

    if (lastToken && lastToken.criadoEm) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      if (lastToken.criadoEm > oneMinuteAgo) {
        this.log.warn('Tentativa de reenvio muito frequente', { usuarioId: usuario.id });
        // Still return success to prevent timing attacks
        return successResponse;
      }
    }

    // Delete old verification tokens for this user
    await this.tokenVerificacaoRepository.deleteByUsuarioIdAndTipo(usuario.id, 'VERIFICACAO_EMAIL');

    // Generate and save new token
    const tokenValue = this.generateToken();
    const token = TokenVerificacao.createVerificationToken(usuario.id, tokenValue);
    await this.tokenVerificacaoRepository.create(token);

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        usuario.props.email,
        tokenValue,
        usuario.props.nome
      );
      this.log.info('Email de verificação reenviado', { usuarioId: usuario.id });
    } catch (error) {
      this.log.error('Falha ao enviar email de verificação', { usuarioId: usuario.id, error });
      // Still return success to prevent information leakage
    }

    return successResponse;
  }
}
