import type { IEmailService } from './IEmailService';
import { logger } from '@/infra/logger';
import { env } from '@/config/env';

const log = logger.child('email:mock');

/**
 * Mock email service for development and testing.
 * Logs emails to console instead of sending them.
 */
export class MockEmailService implements IEmailService {
  // Store sent emails for testing assertions
  public sentEmails: Array<{
    type: 'verification' | 'password-reset';
    to: string;
    token: string;
    nome: string;
    timestamp: Date;
  }> = [];

  async sendVerificationEmail(to: string, token: string, nome: string): Promise<void> {
    const verificationUrl = `${env.FRONTEND_URL}/verificar-email?token=${token}`;

    this.sentEmails.push({
      type: 'verification',
      to,
      token,
      nome,
      timestamp: new Date(),
    });

    log.info('📧 [MOCK] Email de verificação', {
      to,
      nome,
      verificationUrl,
      token: token.substring(0, 8) + '...',
    });

    console.log('\n' + '='.repeat(60));
    console.log('📧 MOCK EMAIL - Verificação de Email');
    console.log('='.repeat(60));
    console.log(`Para: ${to}`);
    console.log(`Nome: ${nome}`);
    console.log(`Link: ${verificationUrl}`);
    console.log(`Token: ${token}`);
    console.log('='.repeat(60) + '\n');
  }

  async sendPasswordResetEmail(to: string, token: string, nome: string): Promise<void> {
    const resetUrl = `${env.FRONTEND_URL}/resetar-senha?token=${token}`;

    this.sentEmails.push({
      type: 'password-reset',
      to,
      token,
      nome,
      timestamp: new Date(),
    });

    log.info('📧 [MOCK] Email de reset de senha', {
      to,
      nome,
      resetUrl,
      token: token.substring(0, 8) + '...',
    });

    console.log('\n' + '='.repeat(60));
    console.log('📧 MOCK EMAIL - Reset de Senha');
    console.log('='.repeat(60));
    console.log(`Para: ${to}`);
    console.log(`Nome: ${nome}`);
    console.log(`Link: ${resetUrl}`);
    console.log(`Token: ${token}`);
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Clear sent emails (useful for tests)
   */
  clearSentEmails(): void {
    this.sentEmails = [];
  }

  /**
   * Get the last sent email of a specific type
   */
  getLastEmail(type?: 'verification' | 'password-reset') {
    const emails = type ? this.sentEmails.filter(e => e.type === type) : this.sentEmails;
    return emails[emails.length - 1] || null;
  }
}

