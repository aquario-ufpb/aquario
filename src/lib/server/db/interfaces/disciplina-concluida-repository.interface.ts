export type CompletedDiscipline = Readonly<{
  disciplinaId: string;
  code: string;
  name: string;
}>;

export type IDisciplinaConcluidaRepository = {
  findByUsuario(usuarioId: string): Promise<CompletedDiscipline[]>;
  replaceForUsuario(usuarioId: string, disciplinaIds: string[]): Promise<void>;
};
