export type IDisciplinaConcluidaRepository = {
  findByUsuario(usuarioId: string): Promise<string[]>;
  replaceForUsuario(usuarioId: string, disciplinaIds: string[]): Promise<void>;
};
