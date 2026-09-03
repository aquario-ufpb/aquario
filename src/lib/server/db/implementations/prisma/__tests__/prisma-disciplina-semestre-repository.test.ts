jest.mock("server-only", () => ({}), { virtual: true });

const mockQueryRaw = jest.fn();
const mockCurriculoCount = jest.fn();
const mockConcluidaCreateMany = jest.fn();
const mockConcluidaDeleteMany = jest.fn();
const mockSemestreCreateMany = jest.fn();
const mockSemestreDeleteMany = jest.fn();

const transaction = {
  $queryRaw: mockQueryRaw,
  curriculoDisciplina: { count: mockCurriculoCount },
  disciplinaConcluida: {
    createMany: mockConcluidaCreateMany,
    deleteMany: mockConcluidaDeleteMany,
  },
  disciplinaSemestre: {
    createMany: mockSemestreCreateMany,
    deleteMany: mockSemestreDeleteMany,
  },
};

jest.mock("@/lib/server/db/prisma", () => ({
  prisma: {
    $transaction: (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction),
  },
}));

import { PrismaDisciplinaSemestreRepository } from "../prisma-disciplina-semestre-repository";

const USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const COURSE_ID = "550e8400-e29b-41d4-a716-446655440010";
const CURRICULUM_ID = "550e8400-e29b-41d4-a716-446655440011";
const DISCIPLINE_ID = "550e8400-e29b-41d4-a716-446655440020";

beforeEach(() => {
  jest.clearAllMocks();
  mockQueryRaw.mockImplementation((strings: TemplateStringsArray) =>
    strings.join(" ").includes('FROM "Usuario"')
      ? Promise.resolve([{ cursoId: COURSE_ID }])
      : Promise.resolve([{ id: CURRICULUM_ID, cursoId: COURSE_ID, ativo: true }])
  );
  mockCurriculoCount.mockResolvedValue(1);
  mockConcluidaCreateMany.mockResolvedValue({ count: 1 });
  mockConcluidaDeleteMany.mockResolvedValue({ count: 0 });
  mockSemestreCreateMany.mockResolvedValue({ count: 1 });
  mockSemestreDeleteMany.mockResolvedValue({ count: 0 });
});

it("locks the user and validates the active curriculum inside the write transaction", async () => {
  const repository = new PrismaDisciplinaSemestreRepository();

  await repository.marcarDisciplinas(
    USER_ID,
    [DISCIPLINE_ID],
    "concluida",
    "semestre-ativo",
    COURSE_ID,
    CURRICULUM_ID
  );

  const queryTemplate = mockQueryRaw.mock.calls[0][0] as TemplateStringsArray;
  expect(queryTemplate.join(" ")).toContain('FROM "Usuario"');
  expect(queryTemplate.join(" ")).toContain("FOR UPDATE");
  const curriculumTemplate = mockQueryRaw.mock.calls[1][0] as TemplateStringsArray;
  expect(curriculumTemplate.join(" ")).toContain('FROM "Curriculo"');
  expect(curriculumTemplate.join(" ")).toContain("FOR UPDATE");
  expect(mockCurriculoCount).toHaveBeenCalledWith({
    where: {
      disciplinaId: { in: [DISCIPLINE_ID] },
      curriculoId: CURRICULUM_ID,
    },
  });
  expect(mockConcluidaCreateMany).toHaveBeenCalled();
});

it("aborts before writing when the locked course changed", async () => {
  mockQueryRaw.mockResolvedValueOnce([{ cursoId: "outro-curso" }]);
  const repository = new PrismaDisciplinaSemestreRepository();

  await expect(
    repository.marcarDisciplinas(
      USER_ID,
      [DISCIPLINE_ID],
      "concluida",
      "semestre-ativo",
      COURSE_ID,
      CURRICULUM_ID
    )
  ).rejects.toThrow("COURSE_CHANGED_DURING_DISCIPLINE_CONFIRMATION");
  expect(mockCurriculoCount).not.toHaveBeenCalled();
  expect(mockConcluidaCreateMany).not.toHaveBeenCalled();
});

it("aborts before writing when a discipline is outside the active curriculum", async () => {
  mockCurriculoCount.mockResolvedValueOnce(0);
  const repository = new PrismaDisciplinaSemestreRepository();

  await expect(
    repository.marcarDisciplinas(
      USER_ID,
      [DISCIPLINE_ID],
      "cursando",
      "semestre-ativo",
      COURSE_ID,
      CURRICULUM_ID
    )
  ).rejects.toThrow("DISCIPLINE_OUTSIDE_ACTIVE_CURRICULUM");
  expect(mockSemestreCreateMany).not.toHaveBeenCalled();
});
