import { Entity } from '@/core/entities/Entity';
import { TipoEntidade } from '@prisma/client';

export interface EntidadeProps {
  nome: string;
  descricao?: string | null;
  tipo: TipoEntidade;
  urlFoto?: string | null;
  contato?: string | null;
  centroId: string;
  projetos?: Record<string, unknown>[];
  publicacoes?: Record<string, unknown>[];
}

export class Entidade extends Entity<EntidadeProps> {
  static create(props: EntidadeProps, id?: string) {
    return new Entidade(props, id);
  }
}
