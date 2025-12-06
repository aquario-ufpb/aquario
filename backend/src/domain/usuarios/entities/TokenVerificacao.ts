import { Entity } from '@/core/entities/Entity';
import { TipoToken } from '@prisma/client';

export interface TokenVerificacaoProps {
  usuarioId: string;
  token: string;
  tipo: TipoToken;
  expiraEm: Date;
  usadoEm?: Date | null;
  criadoEm?: Date;
}

export class TokenVerificacao extends Entity<TokenVerificacaoProps> {
  get usuarioId() {
    return this.props.usuarioId;
  }

  get token() {
    return this.props.token;
  }

  get tipo() {
    return this.props.tipo;
  }

  get expiraEm() {
    return this.props.expiraEm;
  }

  get usadoEm() {
    return this.props.usadoEm;
  }

  get criadoEm() {
    return this.props.criadoEm;
  }

  /**
   * Check if the token has expired
   */
  isExpired(): boolean {
    return new Date() > this.props.expiraEm;
  }

  /**
   * Check if the token has already been used
   */
  isUsed(): boolean {
    return this.props.usadoEm !== null && this.props.usadoEm !== undefined;
  }

  /**
   * Check if the token is valid (not expired and not used)
   */
  isValid(): boolean {
    return !this.isExpired() && !this.isUsed();
  }

  /**
   * Mark the token as used
   */
  markAsUsed(): void {
    this.props.usadoEm = new Date();
  }

  static create(props: TokenVerificacaoProps, id?: string) {
    return new TokenVerificacao(props, id);
  }

  /**
   * Create a new email verification token
   * Expires in 24 hours
   */
  static createVerificationToken(usuarioId: string, token: string): TokenVerificacao {
    const expiraEm = new Date();
    expiraEm.setHours(expiraEm.getHours() + 24);

    return TokenVerificacao.create({
      usuarioId,
      token,
      tipo: 'VERIFICACAO_EMAIL',
      expiraEm,
    });
  }

  /**
   * Create a new password reset token
   * Expires in 1 hour
   */
  static createPasswordResetToken(usuarioId: string, token: string): TokenVerificacao {
    const expiraEm = new Date();
    expiraEm.setHours(expiraEm.getHours() + 1);

    return TokenVerificacao.create({
      usuarioId,
      token,
      tipo: 'RESET_SENHA',
      expiraEm,
    });
  }
}

