import { authenticate, type AuthenticateInput } from "../authenticate";
import type { IUsuariosRepository } from "@/lib/server/db/interfaces/usuarios-repository.interface";
import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";
import { hash } from "bcryptjs";

// Mock JWT service
jest.mock("@/lib/server/services/jwt/jwt", () => ({
  signToken: jest.fn((userId: string) => `mock-token-${userId}`),
}));

describe("authenticate", () => {
  let mockUsuariosRepository: jest.Mocked<IUsuariosRepository>;
  let mockUser: UsuarioWithRelations;

  beforeEach(async () => {
    // Create a user with hashed password
    const senhaHash = await hash("correct-password", 10);

    mockUser = {
      id: "user-123",
      nome: "Test User",
      email: "test@example.com",
      senhaHash,
      papelPlataforma: "USUARIO",
      eVerificado: true,
      urlFotoPerfil: null,
      centroId: "centro-1",
      cursoId: "curso-1",
      dataCadastro: new Date(),
      centro: {
        id: "centro-1",
        nome: "Test Centro",
        sigla: "TC",
      },
      curso: {
        id: "curso-1",
        nome: "Test Curso",
        centroId: "centro-1",
      },
      permissoes: [],
    };

    mockUsuariosRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      list: jest.fn(),
      count: jest.fn(),
    };
  });

  it("should successfully authenticate with correct credentials", async () => {
    mockUsuariosRepository.findByEmail.mockResolvedValue(mockUser);

    const input: AuthenticateInput = {
      email: "test@example.com",
      senha: "correct-password",
    };

    const result = await authenticate(input, mockUsuariosRepository);

    expect(result).toHaveProperty("token");
    expect(result).toHaveProperty("usuario");
    expect(result.token).toBe("mock-token-user-123");
    expect(result.usuario).toEqual(mockUser);
    expect(mockUsuariosRepository.findByEmail).toHaveBeenCalledWith("test@example.com");
  });

  it("should normalize email to lowercase and trim whitespace", async () => {
    mockUsuariosRepository.findByEmail.mockResolvedValue(mockUser);

    const input: AuthenticateInput = {
      email: "  TEST@EXAMPLE.COM  ",
      senha: "correct-password",
    };

    await authenticate(input, mockUsuariosRepository);

    expect(mockUsuariosRepository.findByEmail).toHaveBeenCalledWith("test@example.com");
  });

  it("should throw error if email not found", async () => {
    mockUsuariosRepository.findByEmail.mockResolvedValue(null);

    const input: AuthenticateInput = {
      email: "nonexistent@example.com",
      senha: "any-password",
    };

    await expect(authenticate(input, mockUsuariosRepository)).rejects.toThrow(
      "EMAIL_NAO_ENCONTRADO"
    );
  });

  it("should throw error if user has no password hash", async () => {
    const userWithoutPassword = { ...mockUser, senhaHash: null };
    mockUsuariosRepository.findByEmail.mockResolvedValue(userWithoutPassword);

    const input: AuthenticateInput = {
      email: "test@example.com",
      senha: "any-password",
    };

    await expect(authenticate(input, mockUsuariosRepository)).rejects.toThrow(
      "EMAIL_NAO_ENCONTRADO"
    );
  });

  it("should throw error if password is incorrect", async () => {
    mockUsuariosRepository.findByEmail.mockResolvedValue(mockUser);

    const input: AuthenticateInput = {
      email: "test@example.com",
      senha: "wrong-password",
    };

    await expect(authenticate(input, mockUsuariosRepository)).rejects.toThrow("SENHA_INVALIDA");
  });

  it("should throw error if email is not verified", async () => {
    const unverifiedUser = { ...mockUser, eVerificado: false };
    mockUsuariosRepository.findByEmail.mockResolvedValue(unverifiedUser);

    const input: AuthenticateInput = {
      email: "test@example.com",
      senha: "correct-password",
    };

    await expect(authenticate(input, mockUsuariosRepository)).rejects.toThrow(
      /Email não verificado/
    );
  });

  it("should work with different user roles", async () => {
    const adminUser = { ...mockUser, papelPlataforma: "MASTER_ADMIN" as const };
    mockUsuariosRepository.findByEmail.mockResolvedValue(adminUser);

    const input: AuthenticateInput = {
      email: "test@example.com",
      senha: "correct-password",
    };

    const result = await authenticate(input, mockUsuariosRepository);

    expect(result.usuario.papelPlataforma).toBe("MASTER_ADMIN");
  });

  it("should handle case-insensitive email lookup", async () => {
    mockUsuariosRepository.findByEmail.mockResolvedValue(mockUser);

    const input: AuthenticateInput = {
      email: "TeSt@ExAmPlE.cOm",
      senha: "correct-password",
    };

    const result = await authenticate(input, mockUsuariosRepository);

    expect(result).toHaveProperty("token");
    expect(mockUsuariosRepository.findByEmail).toHaveBeenCalledWith("test@example.com");
  });

  it("should return complete user object with relations", async () => {
    const userWithPermissions = {
      ...mockUser,
      permissoes: [
        {
          id: "perm-1",
          usuarioId: "user-123",
          entidadeId: "ent-1",
          papel: "ADMINISTRADOR" as const,
          dataCriacao: new Date(),
        },
      ],
    };
    mockUsuariosRepository.findByEmail.mockResolvedValue(userWithPermissions);

    const input: AuthenticateInput = {
      email: "test@example.com",
      senha: "correct-password",
    };

    const result = await authenticate(input, mockUsuariosRepository);

    expect(result.usuario.permissoes).toHaveLength(1);
    expect(result.usuario.centro).toBeDefined();
    expect(result.usuario.curso).toBeDefined();
  });
});
