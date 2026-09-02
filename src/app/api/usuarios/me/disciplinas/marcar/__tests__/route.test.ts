/** @jest-environment node */

jest.mock("server-only", () => ({}), { virtual: true });

const mockFindSemestreAtivo = jest.fn();
const mockMarcarDisciplinas = jest.fn();

jest.mock("@/lib/server/services/auth/middleware", () => ({
  withAuth: (_request: Request, handler: (request: Request, user: unknown) => Promise<Response>) =>
    handler(_request, {
      id: "550e8400-e29b-41d4-a716-446655440000",
      cursoId: "550e8400-e29b-41d4-a716-446655440010",
    }),
}));

jest.mock("@/lib/server/container", () => ({
  getContainer: () => ({
    calendarioRepository: { findSemestreAtivo: mockFindSemestreAtivo },
    disciplinaSemestreRepository: { marcarDisciplinas: mockMarcarDisciplinas },
  }),
}));

import { POST } from "../route";

const USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const COURSE_ID = "550e8400-e29b-41d4-a716-446655440010";
const CURRICULUM_ID = "550e8400-e29b-41d4-a716-446655440011";
const ALLOWED_ID = "550e8400-e29b-41d4-a716-446655440001";
const FOREIGN_ID = "550e8400-e29b-41d4-a716-446655440002";

function request(
  status: "concluida" | "cursando" | "none",
  disciplinaIds: string[],
  expectedCursoId?: string,
  expectedCurriculoId?: string
) {
  return new Request("http://localhost/api/usuarios/me/disciplinas/marcar", {
    method: "POST",
    body: JSON.stringify({ status, disciplinaIds, expectedCursoId, expectedCurriculoId }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFindSemestreAtivo.mockResolvedValue({ id: "semestre-ativo" });
  mockMarcarDisciplinas.mockResolvedValue(undefined);
});

it("marca somente disciplinas da grade ativa do curso autenticado", async () => {
  const response = await POST(request("concluida", [ALLOWED_ID], COURSE_ID, CURRICULUM_ID));

  expect(response.status).toBe(200);
  expect(mockMarcarDisciplinas).toHaveBeenCalledWith(
    USER_ID,
    [ALLOWED_ID],
    "concluida",
    "semestre-ativo",
    COURSE_ID,
    CURRICULUM_ID
  );
});

it("traduz a rejeição de disciplina de outra grade", async () => {
  mockMarcarDisciplinas.mockRejectedValueOnce(new Error("DISCIPLINE_OUTSIDE_ACTIVE_CURRICULUM"));
  const response = await POST(request("cursando", [FOREIGN_ID], COURSE_ID, CURRICULUM_ID));

  expect(response.status).toBe(400);
});

it("preserva o fluxo genérico para disciplinas fora da grade", async () => {
  const response = await POST(request("none", [FOREIGN_ID]));

  expect(response.status).toBe(200);
  expect(mockMarcarDisciplinas).toHaveBeenCalledWith(
    USER_ID,
    [FOREIGN_ID],
    "none",
    "semestre-ativo",
    undefined,
    undefined
  );
});

it("rejeita a confirmação quando o curso mudou desde a grade exibida", async () => {
  mockMarcarDisciplinas.mockRejectedValueOnce(
    new Error("COURSE_CHANGED_DURING_DISCIPLINE_CONFIRMATION")
  );
  const response = await POST(request("concluida", [ALLOWED_ID], FOREIGN_ID, CURRICULUM_ID));

  expect(response.status).toBe(400);
});

it("rejeita contexto parcial de confirmação", async () => {
  const response = await POST(request("concluida", [ALLOWED_ID], COURSE_ID));

  expect(response.status).toBe(400);
  expect(mockMarcarDisciplinas).not.toHaveBeenCalled();
});
