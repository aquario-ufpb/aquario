import { randomBytes } from 'crypto';
import { ITokenVerificacaoRepository } from '@/domain/usuarios/repositories/ITokenVerificacaoRepository';
import { IUsuariosRepository } from '@/domain/usuarios/repositories/IUsuariosRepository';
import { TokenVerificacao } from '@/domain/usuarios/entities/TokenVerificacao';
import type { IEmailService } from '@/infra/email';
import { logger } from '@/infra/logger';

interface SolicitarResetSenhaUseCaseRequest {
  email: string;
}

interface SolicitarResetSenhaUseCaseResponse {
  success: boolean;
  message: string;
}

export class SolicitarResetSenhaUseCase {
  private readonly log = logger.child('use-case:solicitar-reset-senha');

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
  }: SolicitarResetSenhaUseCaseRequest): Promise<SolicitarResetSenhaUseCaseResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    this.log.debug('Solicitação de reset de senha', { email: normalizedEmail });

    // Always return success to prevent email enumeration attacks
    const successResponse: SolicitarResetSenhaUseCaseResponse = {
      success: true,
      message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.',
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

    // Check for rate limiting - don't send if last token was created less than 1 minute ago
    const lastToken = await this.tokenVerificacaoRepository.findLatestByUsuarioIdAndTipo(
      usuario.id,
      'RESET_SENHA'
    );

    if (lastToken && lastToken.criadoEm) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      if (lastToken.criadoEm > oneMinuteAgo) {
        this.log.warn('Tentativa de reset muito frequente', { usuarioId: usuario.id });
        // Still return success to prevent timing attacks
        return successResponse;
      }
    }

    // Delete old reset tokens for this user
    await this.tokenVerificacaoRepository.deleteByUsuarioIdAndTipo(usuario.id, 'RESET_SENHA');

    // Generate and save new token
    const tokenValue = this.generateToken();
    const token = TokenVerificacao.createPasswordResetToken(usuario.id, tokenValue);
    await this.tokenVerificacaoRepository.create(token);

    // Send reset email
    try {
      await this.emailService.sendPasswordResetEmail(
        usuario.props.email,
        tokenValue,
        usuario.props.nome
      );
      this.log.info('Email de reset de senha enviado', { usuarioId: usuario.id });
    } catch (error) {
      this.log.error('Falha ao enviar email de reset de senha', { usuarioId: usuario.id, error });
      // Still return success to prevent information leakage
    }

    return successResponse;
  }
}

