import type { Container } from "./types";
import { EMAIL_ENABLED, BLOB_READ_WRITE_TOKEN, BLOB_PATH_PREFIX } from "@/lib/server/config/env";

// Lazy import implementations to avoid circular dependencies
// and to allow tree-shaking in production

let containerInstance: Container | null = null;

/**
 * Get the DI container instance
 *
 * Uses lazy singleton pattern - the container is created on first access
 * and reused for subsequent calls. This is compatible with Next.js
 * serverless/edge functions.
 *
 * @returns The container with all resolved dependencies
 */
export function getContainer(): Container {
  if (!containerInstance) {
    containerInstance = createContainer();
  }
  return containerInstance;
}

/**
 * Reset the container (useful for testing)
 */
export function resetContainer(): void {
  containerInstance = null;
}

/**
 * Create a new container instance
 */
function createContainer(): Container {
  return createPrismaContainer();
}

/**
 * Get the appropriate email service based on environment
 * Uses Resend if API key is configured, otherwise falls back to mock
 */
function getEmailService() {
  if (EMAIL_ENABLED) {
    const { ResendEmailService } = require("@/lib/server/services/email/resend-email-service");
    return new ResendEmailService();
  }

  // No API key = mock mode (for local development)
  const { MockEmailService } = require("@/lib/server/services/email/mock-email-service");
  return new MockEmailService();
}

/**
 * Get the appropriate blob storage service based on environment
 * Uses Vercel Blob if token is configured, otherwise falls back to local storage
 */
function getBlobStorage() {
  if (BLOB_READ_WRITE_TOKEN) {
    const { VercelBlobStorage } = require("@/lib/server/services/blob/vercel-blob-storage");
    return new VercelBlobStorage(BLOB_READ_WRITE_TOKEN, BLOB_PATH_PREFIX);
  }

  // No token = local storage (for development)
  const { LocalBlobStorage } = require("@/lib/server/services/blob/local-blob-storage");
  return new LocalBlobStorage();
}

/**
 * Create container with Prisma implementations
 */
function createPrismaContainer(): Container {
  // Dynamic imports to avoid loading all implementations at startup
  const {
    PrismaUsuariosRepository,
  } = require("@/lib/server/db/implementations/prisma/prisma-usuarios-repository");
  const {
    PrismaCampusRepository,
  } = require("@/lib/server/db/implementations/prisma/prisma-campus-repository");
  const {
    PrismaCentrosRepository,
  } = require("@/lib/server/db/implementations/prisma/prisma-centros-repository");
  const {
    PrismaCursosRepository,
  } = require("@/lib/server/db/implementations/prisma/prisma-cursos-repository");
  const {
    PrismaTokenVerificacaoRepository,
  } = require("@/lib/server/db/implementations/prisma/prisma-token-verificacao-repository");
  const {
    PrismaEntidadesRepository,
  } = require("@/lib/server/db/implementations/prisma/prisma-entidades-repository");
  const {
    PrismaGuiasRepository,
  } = require("@/lib/server/db/implementations/prisma/prisma-guias-repository");
  const {
    PrismaSecoesGuiaRepository,
  } = require("@/lib/server/db/implementations/prisma/prisma-secoes-guia-repository");
  const {
    PrismaSubSecoesGuiaRepository,
  } = require("@/lib/server/db/implementations/prisma/prisma-sub-secoes-guia-repository");
  const {
    PrismaMembrosRepository,
  } = require("@/lib/server/db/implementations/prisma/prisma-membros-repository");
  const {
    PrismaCargosRepository,
  } = require("@/lib/server/db/implementations/prisma/prisma-cargos-repository");
  const {
    PrismaCurriculosRepository,
  } = require("@/lib/server/db/implementations/prisma/prisma-curriculos-repository");
  const {
    PrismaCalendarioRepository,
  } = require("@/lib/server/db/implementations/prisma/prisma-calendario-repository");

  return {
    usuariosRepository: new PrismaUsuariosRepository(),
    campusRepository: new PrismaCampusRepository(),
    centrosRepository: new PrismaCentrosRepository(),
    cursosRepository: new PrismaCursosRepository(),
    tokenVerificacaoRepository: new PrismaTokenVerificacaoRepository(),
    entidadesRepository: new PrismaEntidadesRepository(),
    guiasRepository: new PrismaGuiasRepository(),
    secoesGuiaRepository: new PrismaSecoesGuiaRepository(),
    subSecoesGuiaRepository: new PrismaSubSecoesGuiaRepository(),
    membrosRepository: new PrismaMembrosRepository(),
    cargosRepository: new PrismaCargosRepository(),
    curriculosRepository: new PrismaCurriculosRepository(),
    calendarioRepository: new PrismaCalendarioRepository(),
    emailService: getEmailService(),
    blobStorage: getBlobStorage(),
  };
}

// Re-export types
export type { Container } from "./types";
