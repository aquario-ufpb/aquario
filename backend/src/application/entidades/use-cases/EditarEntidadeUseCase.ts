import { IEntidadesRepository } from '@/domain/entidades/repositories/IEntidadesRepository';
import { IMembroEntidadeRepository } from '@/domain/entidades/repositories/IMembroEntidadeRepository';
import { IUsuariosRepository } from '@/domain/usuarios/repositories/IUsuariosRepository';
import { logger } from '@/infra/logger';
import { getEntidadeSlug } from '@/shared/utils/slug';

const log = logger.child('use-case:editar-entidade');

interface EditarEntidadeUseCaseRequest {
  entidadeId: string;
  usuarioId: string;
  data: {
    nome?: string;
    subtitle?: string | null;
    descricao?: string | null;
    tipo?: string;
    urlFoto?: string | null;
    contato?: string | null;
    instagram?: string | null;
    linkedin?: string | null;
    website?: string | null;
    location?: string | null;
    foundingDate?: Date | null;
    metadata?: Record<string, unknown> | null;
    slug?: string; // Custom slug (will be merged into metadata)
  };
}

export class EditarEntidadeUseCase {
  constructor(
    private entidadesRepository: IEntidadesRepository,
    private membroEntidadeRepository: IMembroEntidadeRepository,
    private usuariosRepository: IUsuariosRepository
  ) {}

  async execute({ entidadeId, usuarioId, data }: EditarEntidadeUseCaseRequest): Promise<void> {
    log.debug('Iniciando edição de entidade', { entidadeId, usuarioId });

    // Check if entidade exists
    const entidade = await this.entidadesRepository.findById(entidadeId);
    if (!entidade) {
      log.warn('Entidade não encontrada', { entidadeId });
      throw new Error('Entidade não encontrada.');
    }

    // Check if user is MASTER_ADMIN
    const usuario = await this.usuariosRepository.findById(usuarioId);
    if (!usuario) {
      log.warn('Usuário não encontrado', { usuarioId });
      throw new Error('Usuário não encontrado.');
    }

    const isMasterAdmin = usuario.props.papelPlataforma === 'MASTER_ADMIN';

    // If not MASTER_ADMIN, check if user is ADMIN of the entidade
    if (!isMasterAdmin) {
      const isAdmin = await this.membroEntidadeRepository.isUserAdminOfEntidade(
        usuarioId,
        entidadeId
      );

      if (!isAdmin) {
        log.warn('Usuário não tem permissão para editar entidade', {
          usuarioId,
          entidadeId,
          isMasterAdmin,
          isAdmin,
        });
        throw new Error('Você não tem permissão para editar esta entidade.');
      }
    }

    log.info('Autorização concedida para editar entidade', {
      usuarioId,
      entidadeId,
      isMasterAdmin,
    });

    // Prepare update data (only include fields that are provided)
    const updateData: Partial<typeof entidade.props> = {};

    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.tipo !== undefined) updateData.tipo = data.tipo as typeof entidade.props.tipo;
    if (data.urlFoto !== undefined) updateData.urlFoto = data.urlFoto;
    if (data.contato !== undefined) updateData.contato = data.contato;
    if (data.instagram !== undefined) updateData.instagram = data.instagram;
    if (data.linkedin !== undefined) updateData.linkedin = data.linkedin;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.foundingDate !== undefined) updateData.foundingDate = data.foundingDate;

    // Always preserve existing metadata (including slug) unless explicitly updating it
    const currentMetadata = (entidade.props.metadata || {}) as Record<string, unknown>;
    let newMetadata: Record<string, unknown> = { ...currentMetadata };

    // If metadata is explicitly provided, merge it
    if (data.metadata !== undefined) {
      if (data.metadata) {
        newMetadata = { ...currentMetadata, ...(data.metadata as Record<string, unknown>) };
      } else {
        // If metadata is explicitly set to null, clear it
        newMetadata = {};
      }
    }

    // If slug is explicitly provided, validate uniqueness and update it in metadata
    if (data.slug !== undefined) {
      if (data.slug) {
        const trimmedSlug = data.slug.trim();

        // Check if slug is already used by another entidade
        const allEntidades = await this.entidadesRepository.findMany();
        const slugConflict = allEntidades.find(e => {
          // Skip the current entidade being edited
          if (e.id === entidadeId) return false;

          // Check if any other entidade has this slug
          const otherSlug = getEntidadeSlug(e.props.nome, e.props.metadata || null);
          return otherSlug === trimmedSlug;
        });

        if (slugConflict) {
          log.warn('Slug já está em uso', { slug: trimmedSlug, entidadeId });
          throw new Error('Este slug já está sendo usado por outra entidade.');
        }

        newMetadata.slug = trimmedSlug;
      } else {
        // If slug is explicitly set to null/empty, remove it from metadata
        delete newMetadata.slug;
      }
    }

    // Always include metadata in update to preserve existing values (like slug)
    // This ensures the slug doesn't get lost when updating other fields
    updateData.metadata = Object.keys(newMetadata).length > 0 ? newMetadata : undefined;

    // Update entidade
    await this.entidadesRepository.update(entidadeId, updateData);

    log.info('Entidade editada com sucesso', { entidadeId, usuarioId });
  }
}
