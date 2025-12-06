import type { IEmailService } from '@/infra/email';

interface SentEmail {
  type: 'verification' | 'password-reset';
  to: string;
  token: string;
  nome: string;
  timestamp: Date;
}

/**
 * Mock email service for unit tests.
 * Captures sent emails for assertions without actually sending anything.
 */
export class TestEmailService implements IEmailService {
  public sentEmails: SentEmail[] = [];
  public shouldFail = false;
  public failureMessage = 'Mock email service failure';

  async sendVerificationEmail(to: string, token: string, nome: string): Promise<void> {
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    this.sentEmails.push({
      type: 'verification',
      to,
      token,
      nome,
      timestamp: new Date(),
    });
  }

  async sendPasswordResetEmail(to: string, token: string, nome: string): Promise<void> {
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    this.sentEmails.push({
      type: 'password-reset',
      to,
      token,
      nome,
      timestamp: new Date(),
    });
  }

  // ===========================================
  // Helper methods for tests
  // ===========================================

  /**
   * Clear all sent emails
   */
  clear(): void {
    this.sentEmails = [];
    this.shouldFail = false;
  }

  /**
   * Get all sent emails
   */
  getAllEmails(): SentEmail[] {
    return this.sentEmails;
  }

  /**
   * Get the last sent email
   */
  getLastEmail(): SentEmail | null {
    return this.sentEmails[this.sentEmails.length - 1] ?? null;
  }

  /**
   * Get the last verification email
   */
  getLastVerificationEmail(): SentEmail | null {
    const verificationEmails = this.sentEmails.filter(e => e.type === 'verification');
    return verificationEmails[verificationEmails.length - 1] ?? null;
  }

  /**
   * Get the last password reset email
   */
  getLastPasswordResetEmail(): SentEmail | null {
    const resetEmails = this.sentEmails.filter(e => e.type === 'password-reset');
    return resetEmails[resetEmails.length - 1] ?? null;
  }

  /**
   * Get all emails sent to a specific address
   */
  getEmailsSentTo(email: string): SentEmail[] {
    return this.sentEmails.filter(e => e.to === email);
  }

  /**
   * Check if a verification email was sent to a specific address
   */
  wasVerificationEmailSentTo(email: string): boolean {
    return this.sentEmails.some(e => e.type === 'verification' && e.to === email);
  }

  /**
   * Check if a password reset email was sent to a specific address
   */
  wasPasswordResetEmailSentTo(email: string): boolean {
    return this.sentEmails.some(e => e.type === 'password-reset' && e.to === email);
  }

  /**
   * Simulate email service failure
   */
  simulateFailure(message = 'Mock email service failure'): void {
    this.shouldFail = true;
    this.failureMessage = message;
  }

  /**
   * Stop simulating failure
   */
  stopSimulatingFailure(): void {
    this.shouldFail = false;
  }
}

