import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import type { IUsuariosRepository } from "@/lib/server/db/interfaces/usuarios-repository.interface";
import type { ICentrosRepository } from "@/lib/server/db/interfaces/centros-repository.interface";
import type { ICursosRepository } from "@/lib/server/db/interfaces/cursos-repository.interface";
import type { ITokenVerificacaoRepository } from "@/lib/server/db/interfaces/token-verificacao-repository.interface";
import type { IEmailService } from "@/lib/server/services/email/email-service.interface";

// Allowed email domains for registration
const ALLOWED_EMAIL_DOMAINS = ["@academico.ufpb.br"];

export type RegisterInput = {
  nome: string;
  email: string;
  senha: string;
  centroId: string;
  cursoId: string;
  urlFotoPerfil?: string;
};

export type RegisterResult = {
  usuarioId: string;
  autoVerificado: boolean;
};

export type RegisterDependencies = {
  usuariosRepository: IUsuariosRepository;
  centrosRepository: ICentrosRepository;
  cursosRepository: ICursosRepository;
  tokenVerificacaoRepository: ITokenVerificacaoRepository;
  emailService: IEmailService;
};

function getMasterAdminEmails(): string[] {
  const emails = process.env.MASTER_ADMIN_EMAILS || "";
  return emails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isMasterAdminEmail(email: string): boolean {
  return getMasterAdminEmails().includes(email.toLowerCase());
}

function isAllowedEmailDomain(email: string): boolean {
  return ALLOWED_EMAIL_DOMAINS.some((domain) =>
    email.toLowerCase().endsWith(domain)
  );
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function shouldAutoVerify(): boolean {
  return process.env.EMAIL_MOCK_MODE === "true";
}

/**
 * Register a new user
 */
export async function register(
  input: RegisterInput,
  deps: RegisterDependencies
): Promise<RegisterResult> {
  const normalizedEmail = input.email.toLowerCase().trim();

  // Validate email domain (allow MASTER_ADMIN emails regardless of domain)
  if (!isAllowedEmailDomain(normalizedEmail) && !isMasterAdminEmail(normalizedEmail)) {
    throw new Error("Apenas emails acadêmicos (@academico.ufpb.br) são permitidos.");
  }

  // Check if email is already registered
  const existingUser = await deps.usuariosRepository.findByEmail(normalizedEmail);
  if (existingUser) {
    throw new Error("Este e-mail já está em uso.");
  }

  // Validate centro
  const centro = await deps.centrosRepository.findById(input.centroId);
  if (!centro) {
    throw new Error("Centro não encontrado.");
  }

  // Validate curso
  const curso = await deps.cursosRepository.findById(input.cursoId);
  if (!curso) {
    throw new Error("Curso não encontrado.");
  }

  // Ensure curso belongs to the selected centro
  if (curso.centroId !== input.centroId) {
    throw new Error("O curso selecionado não pertence ao centro informado.");
  }

  // Hash password
  const senhaHash = await hash(input.senha, 10);

  // Determine platform role
  const papelPlataforma = isMasterAdminEmail(normalizedEmail) ? "MASTER_ADMIN" : "USER";

  // Auto-verify in mock mode
  const autoVerificado = shouldAutoVerify();

  // Create user
  const usuario = await deps.usuariosRepository.create({
    nome: input.nome,
    email: normalizedEmail,
    senhaHash,
    centroId: input.centroId,
    cursoId: input.cursoId,
    permissoes: [],
    papelPlataforma,
    eVerificado: autoVerificado,
    urlFotoPerfil: input.urlFotoPerfil,
  });

  // In mock mode, skip email verification flow
  if (autoVerificado) {
    return { usuarioId: usuario.id, autoVerificado: true };
  }

  // Generate and save verification token
  const tokenValue = generateToken();
  const expiraEm = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await deps.tokenVerificacaoRepository.create({
    usuarioId: usuario.id,
    token: tokenValue,
    tipo: "VERIFICACAO_EMAIL",
    expiraEm,
  });

  // Send verification email
  try {
    await deps.emailService.sendVerificationEmail(normalizedEmail, tokenValue, input.nome);
  } catch (error) {
    console.error("Failed to send verification email:", error);
    // Don't fail registration if email fails
  }

  return { usuarioId: usuario.id, autoVerificado: false };
}

