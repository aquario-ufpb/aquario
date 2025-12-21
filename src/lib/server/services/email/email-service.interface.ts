/**
 * Email service interface
 *
 * Defines the contract for sending emails. Implementations can use
 * different providers (Resend, SendGrid, etc.) or mock for testing.
 */
export interface IEmailService {
  /**
   * Send email verification link to user
   * @param to - Recipient email address
   * @param token - Verification token
   * @param nome - User's name for personalization
   */
  sendVerificationEmail(to: string, token: string, nome: string): Promise<void>;

  /**
   * Send password reset link to user
   * @param to - Recipient email address
   * @param token - Reset token
   * @param nome - User's name for personalization
   */
  sendPasswordResetEmail(to: string, token: string, nome: string): Promise<void>;
}

