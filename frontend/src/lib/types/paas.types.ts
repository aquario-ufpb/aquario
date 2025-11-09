export type PaasPreference = {
  name: string;
  value: number;
};

export type PaasClass = {
  id: number;
  codigo: string;
  nome: string;
  turma: string;
  docente: string;
  departamento: string;
  horario: string;
  alunos: string;
  preferencias: PaasPreference[];
  pcd: number;
  preAlocacao: string | null;
  paasRoomSolutionId: number;
};

export type PaasRoom = {
  id: number;
  bloco: string;
  nome: string;
  capacidade: number;
  tipo: string;
  acessivel: number;
  preferencias: PaasPreference[];
  execao: string | null;
  paasSolutionId: number;
  classes: PaasClass[];
};

export type PaasSolution = {
  id: number;
  status: string;
  error: string;
  paasPlanId: number | null;
  date: string;
  solution: PaasRoom[];
};

export type PaasPublicSolution = {
  id: number;
  paasPublicId: number;
  paasSolutionId: number;
  userIdVinculo: string | null;
};

export type PaasCenterResponse = {
  id: number;
  centro: string;
  date: string;
  description: string;
  hash: string;
  status: string;
  userId: string | null;
  sigla: string;
  paasPublicSolutions: PaasPublicSolution[];
  solution: PaasSolution;
};
