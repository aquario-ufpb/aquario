import type { IEmailService } from "./email-service.interface";

/**
 * Mock email service for testing
 *
 * Logs emails to console instead of sending them
 */
export class MockEmailService implements IEmailService {
  // Store sent emails for testing assertions
  public sentEmails: Array<{
    type: "verification" | "password-reset";
    to: string;
    token: string;
    nome: string;
    sentAt: Date;
  }> = [];

  async sendVerificationEmail(to: string, token: string, nome: string): Promise<void> {
    console.log(`[MockEmailService] Sending verification email to ${to}`);
    console.log(`  Token: ${token}`);
    console.log(`  Nome: ${nome}`);

    this.sentEmails.push({
      type: "verification",
      to,
      token,
      nome,
      sentAt: new Date(),
    });
  }

  async sendPasswordResetEmail(to: string, token: string, nome: string): Promise<void> {
    console.log(`[MockEmailService] Sending password reset email to ${to}`);
    console.log(`  Token: ${token}`);
    console.log(`  Nome: ${nome}`);

    this.sentEmails.push({
      type: "password-reset",
      to,
      token,
      nome,
      sentAt: new Date(),
    });
  }

  // Helper for testing
  clear(): void {
    this.sentEmails = [];
  }

  getLastEmail() {
    return this.sentEmails[this.sentEmails.length - 1] ?? null;
  }
}

