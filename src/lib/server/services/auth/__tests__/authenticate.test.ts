import { authenticate } from "../authenticate";
import type { IUsuariosRepository } from "@/lib/server/db/interfaces/usuarios-repository.interface";
import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";
import { hash } from "bcryptjs";

// Mock jwt module
jest.mock("@/lib/server/services/jwt/jwt", () => ({
  signToken: jest.fn().mockReturnValue("mock-jwt-token"),
}));

function makeUsuario(overrides: Partial<UsuarioWithRelations> = {}): UsuarioWithRelations {
  return {
    id: "user-1",
    nome: "Test User",
    email: "test@academico.ufpb.br",
    senhaHash: "hashed-password",
    eVerificado: true,
    eFacade: false,
    slug: "test-user",
    urlFotoPerfil: null,
    matricula: null,
    permissoes: [],
    papelPlataforma: "USER",
    periodoAtual: null,
    onboardingMetadata: null,
    centroId: "centro-1",
    cursoId: "curso-1",
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    centro: { id: "centro-1", nome: "CI", sigla: "CI", descricao: null, campusId: "campus-1" },
    curso: {
      id: "curso-1",
      nome: "CC",
      centroId: "centro-1",
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    },
    ...overrides,
  } as UsuarioWithRelations;
}

function makeMockRepo(usuario: UsuarioWithRelations | null = null): IUsuariosRepository {
  return {
    findByEmail: jest.fn().mockResolvedValue(usuario),
    findById: jest.fn(),
    findBySlug: jest.fn(),
    findMany: jest.fn(),
    findManyPaginated: jest.fn(),
    search: jest.fn(),
    create: jest.fn(),
    markAsVerified: jest.fn(),
    updatePassword: jest.fn(),
    updatePapelPlataforma: jest.fn(),
    updateFotoPerfil: jest.fn(),
    updateCentro: jest.fn(),
    updateCurso: jest.fn(),
    updateSlug: jest.fn(),
    updatePeriodoAtual: jest.fn(),
    getOnboardingMetadata: jest.fn(),
    updateOnboardingMetadata: jest.fn(),
    clearOnboardingMetadata: jest.fn(),
    delete: jest.fn(),
  };
}

describe("authenticate", () => {
  it("returns token and user on valid credentials", async () => {
    const senhaHash = await hash("password123", 10);
    const usuario = makeUsuario({ senhaHash });
    const repo = makeMockRepo(usuario);

    const result = await authenticate(
      { email: "Test@academico.ufpb.br", senha: "password123" },
      repo
    );

    expect(result.token).toBe("mock-jwt-token");
    expect(result.usuario).toBe(usuario);
    expect(repo.findByEmail).toHaveBeenCalledWith("test@academico.ufpb.br");
  });

  it("normalizes email to lowercase and trims whitespace", async () => {
    const senhaHash = await hash("password123", 10);
    const usuario = makeUsuario({ senhaHash });
    const repo = makeMockRepo(usuario);

    await authenticate({ email: "  TEST@ACADEMICO.UFPB.BR  ", senha: "password123" }, repo);

    expect(repo.findByEmail).toHaveBeenCalledWith("test@academico.ufpb.br");
  });

  it("throws EMAIL_NAO_ENCONTRADO when user does not exist", async () => {
    const repo = makeMockRepo(null);

    await expect(
      authenticate({ email: "missing@academico.ufpb.br", senha: "password" }, repo)
    ).rejects.toThrow("EMAIL_NAO_ENCONTRADO");
  });

  it("throws EMAIL_NAO_ENCONTRADO when user has no password hash (facade user)", async () => {
    const usuario = makeUsuario({ senhaHash: null });
    const repo = makeMockRepo(usuario);

    await expect(
      authenticate({ email: "test@academico.ufpb.br", senha: "password" }, repo)
    ).rejects.toThrow("EMAIL_NAO_ENCONTRADO");
  });

  it("throws SENHA_INVALIDA when password does not match", async () => {
    const senhaHash = await hash("correct-password", 10);
    const usuario = makeUsuario({ senhaHash });
    const repo = makeMockRepo(usuario);

    await expect(
      authenticate({ email: "test@academico.ufpb.br", senha: "wrong-password" }, repo)
    ).rejects.toThrow("SENHA_INVALIDA");
  });

  it("throws when user email is not verified", async () => {
    const senhaHash = await hash("password123", 10);
    const usuario = makeUsuario({ senhaHash, eVerificado: false });
    const repo = makeMockRepo(usuario);

    await expect(
      authenticate({ email: "test@academico.ufpb.br", senha: "password123" }, repo)
    ).rejects.toThrow("Email não verificado");
  });
});
