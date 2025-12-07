import { IEntidadesRepository } from '@/domain/entidades/repositories/IEntidadesRepository';
import { Entidade } from '@/domain/entidades/entities/Entidade';
import { getEntidadeSlug } from '@/shared/utils/slug';

interface BuscarEntidadePorSlugUseCaseResponse {
  entidade: Entidade | null;
}

export class BuscarEntidadePorSlugUseCase {
  constructor(private entidadesRepository: IEntidadesRepository) {}

  async execute(slug: string): Promise<BuscarEntidadePorSlugUseCaseResponse> {
    const entidades = await this.entidadesRepository.findMany();

    // Find entidade by matching slug (check metadata.slug first, then fallback to generated from nome)
    const entidade =
      entidades.find(e => getEntidadeSlug(e.props.nome, e.props.metadata || null) === slug) || null;

    return { entidade };
  }
}
