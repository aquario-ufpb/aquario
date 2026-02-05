import type { IEmailService } from "./email-service.interface";
import { createLogger } from "@/lib/server/utils/logger";

const log = createLogger("MockEmail");

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

  sendVerificationEmail(to: string, token: string, nome: string): Promise<void> {
    log.info("Sending verification email", { to, token, nome });

    this.sentEmails.push({
      type: "verification",
      to,
      token,
      nome,
      sentAt: new Date(),
    });

    return Promise.resolve();
  }

  sendPasswordResetEmail(to: string, token: string, nome: string): Promise<void> {
    log.info("Sending password reset email", { to, token, nome });

    this.sentEmails.push({
      type: "password-reset",
      to,
      token,
      nome,
      sentAt: new Date(),
    });

    return Promise.resolve();
  }

  // Helper for testing
  clear(): void {
    this.sentEmails = [];
  }

  getLastEmail() {
    return this.sentEmails[this.sentEmails.length - 1] ?? null;
  }
}
