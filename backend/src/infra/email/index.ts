import { ResendEmailService } from './ResendEmailService';
import { MockEmailService } from './MockEmailService';
import { env } from '@/config/env';
import { logger } from '@/infra/logger';

// Type-only re-export for interface
export type { IEmailService } from './IEmailService';

// Regular re-exports for classes
export { ResendEmailService } from './ResendEmailService';
export { MockEmailService } from './MockEmailService';

// Import type for use in this file
import type { IEmailService } from './IEmailService';

const log = logger.child('email:factory');

/**
 * Factory function to create the appropriate email service
 * based on environment configuration.
 */
export function createEmailService(): IEmailService {
  if (env.EMAIL_MOCK_MODE) {
    log.info('Usando MockEmailService (EMAIL_MOCK_MODE=true)');
    return new MockEmailService();
  }

  if (!env.RESEND_API_KEY) {
    log.warn('RESEND_API_KEY não configurado, usando MockEmailService');
    return new MockEmailService();
  }

  log.info('Usando ResendEmailService');
  return new ResendEmailService();
}

// Singleton instance for convenience
let emailServiceInstance: IEmailService | null = null;

/**
 * Get the singleton email service instance.
 * Creates one if it doesn't exist.
 */
export function getEmailService(): IEmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = createEmailService();
  }
  return emailServiceInstance;
}

/**
 * Reset the singleton instance (useful for tests).
 */
export function resetEmailService(): void {
  emailServiceInstance = null;
}
