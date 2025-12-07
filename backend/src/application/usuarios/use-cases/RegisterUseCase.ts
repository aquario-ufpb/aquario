import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { IUsuariosRepository } from '@/domain/usuarios/repositories/IUsuariosRepository';
import { Usuario } from '@/domain/usuarios/entities/Usuario';
import { PapelPlataforma } from '@prisma/client';
import { ICentrosRepository } from '@/domain/centros/repositories/ICentrosRepository';
import { ICursosRepository } from '@/domain/cursos/repositories/ICursosRepository';
import { ITokenVerificacaoRepository } from '@/domain/usuarios/repositories/ITokenVerificacaoRepository';
import { TokenVerificacao } from '@/domain/usuarios/entities/TokenVerificacao';
import type { IEmailService } from '@/infra/email';
import { env } from '@/config/env';
import { logger } from '@/infra/logger';

// Allowed email domains for registration
const ALLOWED_EMAIL_DOMAINS = ['@academico.ufpb.br'];

interface RegisterUseCaseRequest {
  nome: string;
  email: string;
  senha: string;
  centroId: string;
  cursoId: string;
  urlFotoPerfil?: string;
}

interface RegisterUseCaseResponse {
  usuarioId: string;
  autoVerificado: boolean;
}

export class RegisterUseCase {
  private readonly log = logger.child('use-case:register');

  constructor(
    private usuariosRepository: IUsuariosRepository,
    private centrosRepository: ICentrosRepository,
    private cursosRepository: ICursosRepository,
    private tokenVerificacaoRepository: ITokenVerificacaoRepository,
    private emailService: IEmailService
  ) {}

  /**
   * Get list of MASTER_ADMIN emails from environment
   * Note: We read from process.env directly to allow testing with different values
   */
  private getMasterAdminEmails(): string[] {
    const emails = process.env.MASTER_ADMIN_EMAILS || env.MASTER_ADMIN_EMAILS || '';
    return emails
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
  }

  /**
   * Check if email is in MASTER_ADMIN list
   */
  private isMasterAdminEmail(email: string): boolean {
    return this.getMasterAdminEmails().includes(email.toLowerCase());
  }

  /**
   * Check if email domain is allowed
   */
  private isAllowedEmailDomain(email: string): boolean {
    return ALLOWED_EMAIL_DOMAINS.some(domain => email.toLowerCase().endsWith(domain));
  }

  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Check if we should auto-verify users (dev/mock mode)
   * Note: We read from process.env directly to allow testing with different values
   */
  private shouldAutoVerify(): boolean {
    const mockMode = process.env.EMAIL_MOCK_MODE ?? String(env.EMAIL_MOCK_MODE);
    return mockMode === 'true';
  }

  async execute({
    nome,
    email,
    senha,
    centroId,
    cursoId,
    urlFotoPerfil,
  }: RegisterUseCaseRequest): Promise<RegisterUseCaseResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    this.log.debug('Iniciando registro de usuário', {
      email: normalizedEmail,
      centroId,
      cursoId,
    });

    // Validate email domain (allow MASTER_ADMIN emails regardless of domain)
    if (!this.isAllowedEmailDomain(normalizedEmail) && !this.isMasterAdminEmail(normalizedEmail)) {
      this.log.warn('Domínio de email não permitido', { email: normalizedEmail });
      throw new Error('Apenas emails acadêmicos (@academico.ufpb.br) são permitidos.');
    }

    // Check if email is already registered
    const usuarioComMesmoEmail = await this.usuariosRepository.findByEmail(normalizedEmail);
    if (usuarioComMesmoEmail) {
      this.log.warn('E-mail já cadastrado', { email: normalizedEmail });
      throw new Error('Este e-mail já está em uso.');
    }

    // Validate centro
    const centro = await this.centrosRepository.findById(centroId);
    if (!centro) {
      this.log.warn('Centro não encontrado durante registro', { centroId });
      throw new Error('Centro não encontrado.');
    }

    // Validate curso
    const curso = await this.cursosRepository.findById(cursoId);
    if (!curso) {
      this.log.warn('Curso não encontrado durante registro', { cursoId });
      throw new Error('Curso não encontrado.');
    }

    // Ensure curso belongs to the selected centro
    if (curso.centroId !== centroId) {
      this.log.warn('Curso não pertence ao centro selecionado', { cursoId, centroId, cursoCentroId: curso.centroId });
      throw new Error('O curso selecionado não pertence ao centro informado.');
    }

    // Hash password
    const senhaHash = await hash(senha, 10);

    // Determine platform role (auto-assign MASTER_ADMIN for configured emails)
    const papelPlataforma = this.isMasterAdminEmail(normalizedEmail)
      ? PapelPlataforma.MASTER_ADMIN
      : PapelPlataforma.USER;

    if (papelPlataforma === PapelPlataforma.MASTER_ADMIN) {
      this.log.info('Atribuindo papel MASTER_ADMIN ao usuário', { email: normalizedEmail });
    }

    // Auto-verify in mock mode (dev environment)
    const autoVerificado = this.shouldAutoVerify();

    // Create user
    const usuario = Usuario.create({
      nome,
      email: normalizedEmail,
      senhaHash,
      permissoes: [],
      papelPlataforma,
      eVerificado: autoVerificado,
      centro,
      curso,
      urlFotoPerfil,
    });

    await this.usuariosRepository.create(usuario);

    this.log.info('Usuário registrado com sucesso', {
      usuarioId: usuario.id,
      email: normalizedEmail,
      papelPlataforma,
      autoVerificado,
    });

    // In mock mode, skip email verification flow
    if (autoVerificado) {
      this.log.info('Usuário auto-verificado (EMAIL_MOCK_MODE=true)', { usuarioId: usuario.id });
      return { usuarioId: usuario.id, autoVerificado: true };
    }

    // Generate and save verification token
    const tokenValue = this.generateToken();
    const token = TokenVerificacao.createVerificationToken(usuario.id, tokenValue);
    await this.tokenVerificacaoRepository.create(token);

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(normalizedEmail, tokenValue, nome);
      this.log.info('Email de verificação enviado', { usuarioId: usuario.id });
    } catch (error) {
      // Log error but don't fail registration
      this.log.error('Falha ao enviar email de verificação', {
        usuarioId: usuario.id,
        error,
      });
    }

    return { usuarioId: usuario.id, autoVerificado: false };
  }
}
