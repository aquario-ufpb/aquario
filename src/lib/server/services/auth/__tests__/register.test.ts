import { register, type RegisterDependencies } from "../register";
import type { UsuarioWithRelations, Centro, Curso } from "@/lib/server/db/interfaces/types";

// Mock bcryptjs
jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password"),
}));

// Mock env - email disabled by default (auto-verify)
jest.mock("@/lib/server/config/env", () => ({
  MASTER_ADMIN_EMAILS: ["admin@gmail.com"],
  EMAIL_ENABLED: false,
}));

// Mock logger
jest.mock("@/lib/server/utils/logger", () => ({
  createLogger: () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn(), debug: jest.fn() }),
}));

const mockCentro: Centro = {
  id: "centro-1",
  nome: "CI",
  sigla: "CI",
  descricao: null,
  campusId: "campus-1",
};

const mockCurso = {
  id: "curso-1",
  nome: "Ciência da Computação",
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

function makeDeps(overrides: Partial<RegisterDependencies> = {}): RegisterDependencies {
  return {
    usuariosRepository: {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockCreatedUser),
    } as any,
    centrosRepository: {
      findById: jest.fn().mockResolvedValue(mockCentro),
    } as any,
    cursosRepository: {
      findById: jest.fn().mockResolvedValue(mockCurso),
    } as any,
    tokenVerificacaoRepository: {
      create: jest.fn().mockResolvedValue({ id: "token-1" }),
    } as any,
    emailService: {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn(),
    },
    ...overrides,
  };
}

const validInput = {
  nome: "Test User",
  email: "test@academico.ufpb.br",
  senha: "password123",
  centroId: "centro-1",
  cursoId: "curso-1",
};

describe("register", () => {
  it("creates user with auto-verification when email is disabled", async () => {
    const deps = makeDeps();

    const result = await register(validInput, deps);

    expect(result.usuarioId).toBe("new-user-id");
    expect(result.autoVerificado).toBe(true);
    expect(deps.usuariosRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: "Test User",
        email: "test@academico.ufpb.br",
        senhaHash: "hashed-password",
        eVerificado: true,
        papelPlataforma: "USER",
      })
    );
    // No token created when auto-verified
    expect(deps.tokenVerificacaoRepository.create).not.toHaveBeenCalled();
  });

  it("normalizes email to lowercase", async () => {
    const deps = makeDeps();

    await register({ ...validInput, email: "TEST@ACADEMICO.UFPB.BR" }, deps);

    expect(deps.usuariosRepository.findByEmail).toHaveBeenCalledWith("test@academico.ufpb.br");
  });

  it("rejects non-UFPB email domains", async () => {
    const deps = makeDeps();

    await expect(register({ ...validInput, email: "test@gmail.com" }, deps)).rejects.toThrow(
      "Apenas emails acadêmicos"
    );
  });

  it("allows master admin emails regardless of domain", async () => {
    const deps = makeDeps();

    const result = await register({ ...validInput, email: "admin@gmail.com" }, deps);

    expect(result.usuarioId).toBe("new-user-id");
    expect(deps.usuariosRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ papelPlataforma: "MASTER_ADMIN" })
    );
  });

  it("throws when email is already registered", async () => {
    const deps = makeDeps({
      usuariosRepository: {
        findByEmail: jest.fn().mockResolvedValue(mockCreatedUser),
        create: jest.fn(),
      } as any,
    });

    await expect(register(validInput, deps)).rejects.toThrow("já está em uso");
  });

  it("throws when centro is not found", async () => {
    const deps = makeDeps({
      centrosRepository: { findById: jest.fn().mockResolvedValue(null) } as any,
    });

    await expect(register(validInput, deps)).rejects.toThrow("Centro não encontrado");
  });

  it("throws when curso is not found", async () => {
    const deps = makeDeps({
      cursosRepository: { findById: jest.fn().mockResolvedValue(null) } as any,
    });

    await expect(register(validInput, deps)).rejects.toThrow("Curso não encontrado");
  });

  it("throws when curso does not belong to selected centro", async () => {
    const wrongCentoCurso = { ...mockCurso, centroId: "different-centro" } as Curso;
    const deps = makeDeps({
      cursosRepository: { findById: jest.fn().mockResolvedValue(wrongCentoCurso) } as any,
    });

    await expect(register(validInput, deps)).rejects.toThrow("não pertence ao centro");
  });

  it("assigns USER role for regular UFPB emails", async () => {
    const deps = makeDeps();

    await register(validInput, deps);

    expect(deps.usuariosRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ papelPlataforma: "USER" })
    );
  });
});
