import type { RegisterDependencies } from "../register";
import type { Centro, Curso, UsuarioWithRelations } from "@/lib/server/db/interfaces/types";

const mockCentro: Centro = {
  id: "centro-1",
  nome: "CI",
  sigla: "CI",
  descricao: null,
  campusId: "campus-1",
};

const mockCurso = {
  id: "curso-1",
  nome: "Ciencia da Computacao",
  centroId: "centro-1",
  criadoEm: new Date(),
  atualizadoEm: new Date(),
} as Curso;

const mockCreatedUser = {
  id: "new-user-id",
  nome: "Test User",
  email: "test@academico.ufpb.br",
  centro: mockCentro,
  curso: mockCurso,
} as UsuarioWithRelations;

function makeDeps(): RegisterDependencies {
  return {
    usuariosRepository: {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockCreatedUser),
    } as unknown as RegisterDependencies["usuariosRepository"],
    centrosRepository: {
      findById: jest.fn().mockResolvedValue(mockCentro),
    } as unknown as RegisterDependencies["centrosRepository"],
    cursosRepository: {
      findById: jest.fn().mockResolvedValue(mockCurso),
    } as unknown as RegisterDependencies["cursosRepository"],
    tokenVerificacaoRepository: {
      create: jest.fn().mockResolvedValue({ id: "token-1" }),
    } as unknown as RegisterDependencies["tokenVerificacaoRepository"],
    emailService: {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn(),
    },
  };
}

const validInput = {
  nome: "Test User",
  email: "test@academico.ufpb.br",
  senha: "password123",
  centroId: "centro-1",
  cursoId: "curso-1",
};

describe("register production email configuration", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("@/lib/server/config/env");
    jest.dontMock("bcryptjs");
    jest.dontMock("@/lib/server/utils/logger");
  });

  it("does not auto-verify or create users in production when email is unavailable", async () => {
    jest.doMock("bcryptjs", () => ({
      hash: jest.fn().mockResolvedValue("hashed-password"),
    }));
    jest.doMock("@/lib/server/config/env", () => ({
      MASTER_ADMIN_EMAILS: [],
      EMAIL_ENABLED: false,
      IS_PROD: true,
    }));
    jest.doMock("@/lib/server/utils/logger", () => ({
      createLogger: () => ({
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      }),
    }));

    const { register } = await import("../register");
    const deps = makeDeps();

    await expect(register(validInput, deps)).rejects.toThrow("servico de email");
    expect(deps.usuariosRepository.create).not.toHaveBeenCalled();
    expect(deps.tokenVerificacaoRepository.create).not.toHaveBeenCalled();
  });
});
