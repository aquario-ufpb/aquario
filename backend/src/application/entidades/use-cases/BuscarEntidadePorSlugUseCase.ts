import { IEntidadesRepository } from '@/domain/entidades/repositories/IEntidadesRepository';
import { Entidade } from '@/domain/entidades/entities/Entidade';

interface BuscarEntidadePorSlugUseCaseResponse {
  entidade: Entidade | null;
}

export class BuscarEntidadePorSlugUseCase {
  constructor(private entidadesRepository: IEntidadesRepository) {}

  private nomeToSlug(nome: string): string {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  async execute(slug: string): Promise<BuscarEntidadePorSlugUseCaseResponse> {
    const entidades = await this.entidadesRepository.findMany();

    // Find entidade by matching slug (generated from nome)
    const entidade = entidades.find(e => this.nomeToSlug(e.props.nome) === slug) || null;

    return { entidade };
  }
}
