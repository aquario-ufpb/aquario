import type { IUsuariosRepository } from "@/lib/server/db/interfaces/usuarios-repository.interface";
import type { ICentrosRepository } from "@/lib/server/db/interfaces/centros-repository.interface";
import type { ICursosRepository } from "@/lib/server/db/interfaces/cursos-repository.interface";
import type { ITokenVerificacaoRepository } from "@/lib/server/db/interfaces/token-verificacao-repository.interface";
import type { IEntidadesRepository } from "@/lib/server/db/interfaces/entidades-repository.interface";
import type {
  IGuiasRepository,
  ISecoesGuiaRepository,
  ISubSecoesGuiaRepository,
} from "@/lib/server/db/interfaces/guias-repository.interface";
import type { IEmailService } from "@/lib/server/services/email/email-service.interface";
import type { IBlobStorage } from "@/lib/server/services/blob/blob-storage.interface";

/**
 * Container type definition
 *
 * This defines all the dependencies that can be resolved from the container.
 * The container uses lazy initialization to create singletons.
 */
export type Container = {
  // Repositories
  usuariosRepository: IUsuariosRepository;
  centrosRepository: ICentrosRepository;
  cursosRepository: ICursosRepository;
  tokenVerificacaoRepository: ITokenVerificacaoRepository;
  entidadesRepository: IEntidadesRepository;
  guiasRepository: IGuiasRepository;
  secoesGuiaRepository: ISecoesGuiaRepository;
  subSecoesGuiaRepository: ISubSecoesGuiaRepository;

  // Services
  emailService: IEmailService;
  blobStorage: IBlobStorage;
};

/**
 * Database provider type
 */
export type DbProvider = "prisma" | "memory";
