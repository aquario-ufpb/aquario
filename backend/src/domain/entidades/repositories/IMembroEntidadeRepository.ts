export interface MembroComUsuario {
  id: string;
  papel: string; // PapelMembro: ADMIN or MEMBRO
  usuario: {
    id: string;
    nome: string;
    urlFotoPerfil?: string | null;
    curso?: { nome: string } | null;
  };
}

export interface IMembroEntidadeRepository {
  findManyByEntidadeId(entidadeId: string): Promise<MembroComUsuario[]>;
  isUserAdminOfEntidade(usuarioId: string, entidadeId: string): Promise<boolean>;
}
