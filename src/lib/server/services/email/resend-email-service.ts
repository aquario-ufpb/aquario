import { Resend } from "resend";
import type { IEmailService } from "./email-service.interface";
import { RESEND_API_KEY, EMAIL_FROM, APP_URL } from "@/lib/server/config/env";
import { createLogger } from "@/lib/server/utils/logger";

const log = createLogger("Email");

export class ResendEmailService implements IEmailService {
  private resend: Resend;
  private fromEmail: string;
  private frontendUrl: string;

  constructor() {
    if (!RESEND_API_KEY) {
      throw new Error("ResendEmailService requires RESEND_API_KEY to be set");
    }

    this.resend = new Resend(RESEND_API_KEY);
    this.fromEmail = EMAIL_FROM;
    this.frontendUrl = APP_URL;
  }

  async sendVerificationEmail(to: string, token: string, nome: string): Promise<void> {
    const verificationUrl = `${this.frontendUrl}/verificar-email#token=${encodeURIComponent(token)}`;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: "Verifique seu email - Aquário UFPB",
        html: this.getVerificationEmailTemplate(nome, verificationUrl),
      });
    } catch (error) {
      log.error("Failed to send verification email", error, { to });
      throw new Error("Falha ao enviar email de verificação.");
    }
  }

  async sendPasswordResetEmail(to: string, token: string, nome: string): Promise<void> {
    const resetUrl = `${this.frontendUrl}/resetar-senha#token=${encodeURIComponent(token)}`;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: "Redefinir senha - Aquário UFPB",
        html: this.getPasswordResetEmailTemplate(nome, resetUrl),
      });
    } catch (error) {
      log.error("Failed to send password reset email", error, { to });
      throw new Error("Falha ao enviar email de reset de senha.");
    }
  }

  private getVerificationEmailTemplate(nome: string, verificationUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifique seu email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0066cc 0%, #004499 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🌊 Aquário UFPB</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Olá, ${nome}!</h2>
    
    <p>Bem-vindo(a) ao Aquário! Para completar seu cadastro, por favor verifique seu email clicando no botão abaixo:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background: #0066cc; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        Verificar Email
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      Se o botão não funcionar, copie e cole o link abaixo no seu navegador:<br>
      <a href="${verificationUrl}" style="color: #0066cc; word-break: break-all;">${verificationUrl}</a>
    </p>
    
    <p style="color: #666; font-size: 14px;">
      Este link expira em 24 horas. Se você não solicitou este email, pode ignorá-lo com segurança.
    </p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
      © ${new Date().getFullYear()} Aquário UFPB - Centro de Informática
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  private getPasswordResetEmailTemplate(nome: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir senha</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0066cc 0%, #004499 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🌊 Aquário UFPB</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Olá, ${nome}!</h2>
    
    <p>Recebemos uma solicitação para redefinir a senha da sua conta no Aquário.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #0066cc; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        Redefinir Senha
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      Se o botão não funcionar, copie e cole o link abaixo no seu navegador:<br>
      <a href="${resetUrl}" style="color: #0066cc; word-break: break-all;">${resetUrl}</a>
    </p>
    
    <p style="color: #666; font-size: 14px;">
      Este link expira em 1 hora. Se você não solicitou a redefinição de senha, pode ignorar este email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
      © ${new Date().getFullYear()} Aquário UFPB - Centro de Informática
    </p>
  </div>
</body>
</html>
    `.trim();
  }
}
