import { register, type RegisterInput, type RegisterDependencies } from "../register";
import { hash } from "bcryptjs";

// Mock dependencies
jest.mock("bcryptjs");
jest.mock("@/lib/server/config/env", () => ({
  MASTER_ADMIN_EMAILS: ["admin@test.com"],
  EMAIL_ENABLED: true,
}));

describe("register", () => {
  let mockDeps: jest.Mocked<RegisterDependencies>;

  beforeEach(() => {
    mockDeps = {
      usuariosRepository: {
        findByEmail: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        list: jest.fn(),
        count: jest.fn(),
      } as any,
      centrosRepository: {
        findById: jest.fn(),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      } as any,
      cursosRepository: {
        findById: jest.fn(),
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findByCentroId: jest.fn(),
      } as any,
      tokenVerificacaoRepository: {
        create: jest.fn(),
        findByToken: jest.fn(),
        deleteByUsuarioId: jest.fn(),
        deleteExpired: jest.fn(),
      } as any,
      emailService: {
        sendVerificationEmail: jest.fn(),
        sendPasswordResetEmail: jest.fn(),
      } as any,
    };

    (hash as jest.Mock).mockResolvedValue("hashed-password");

    jest.clearAllMocks();
  });

  it("should successfully register a new user with valid academic email", async () => {
    const input: RegisterInput = {
      nome: "Test User",
      email: "test@academico.ufpb.br",
      senha: "password123",
      centroId: "centro-1",
      cursoId: "curso-1",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue(null);
    mockDeps.centrosRepository.findById.mockResolvedValue({
      id: "centro-1",
      nome: "Centro de Informática",
      sigla: "CI",
    });
    mockDeps.cursosRepository.findById.mockResolvedValue({
      id: "curso-1",
      nome: "Ciência da Computação",
      centroId: "centro-1",
    });
    mockDeps.usuariosRepository.create.mockResolvedValue({
      id: "user-123",
      nome: input.nome,
      email: "test@academico.ufpb.br",
      senhaHash: "hashed-password",
      papelPlataforma: "USER",
      eVerificado: false,
      urlFotoPerfil: null,
      centroId: "centro-1",
      cursoId: "curso-1",
      dataCadastro: new Date(),
    } as any);
    mockDeps.emailService.sendVerificationEmail.mockResolvedValue(undefined);

    const result = await register(input, mockDeps);

    expect(result.usuarioId).toBe("user-123");
    expect(result.autoVerificado).toBe(false);
    expect(mockDeps.usuariosRepository.create).toHaveBeenCalled();
    expect(mockDeps.tokenVerificacaoRepository.create).toHaveBeenCalled();
    expect(mockDeps.emailService.sendVerificationEmail).toHaveBeenCalledWith(
      "test@academico.ufpb.br",
      expect.any(String),
      "Test User"
    );
  });

  it("should normalize email to lowercase and trim whitespace", async () => {
    const input: RegisterInput = {
      nome: "Test User",
      email: "  TEST@ACADEMICO.UFPB.BR  ",
      senha: "password123",
      centroId: "centro-1",
      cursoId: "curso-1",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue(null);
    mockDeps.centrosRepository.findById.mockResolvedValue({
      id: "centro-1",
      nome: "Test Centro",
      sigla: "TC",
    });
    mockDeps.cursosRepository.findById.mockResolvedValue({
      id: "curso-1",
      nome: "Test Curso",
      centroId: "centro-1",
    });
    mockDeps.usuariosRepository.create.mockResolvedValue({
      id: "user-123",
    } as any);

    await register(input, mockDeps);

    expect(mockDeps.usuariosRepository.findByEmail).toHaveBeenCalledWith(
      "test@academico.ufpb.br"
    );
  });

  it("should throw error for non-academic email domain", async () => {
    const input: RegisterInput = {
      nome: "Test User",
      email: "test@gmail.com",
      senha: "password123",
      centroId: "centro-1",
      cursoId: "curso-1",
    };

    await expect(register(input, mockDeps)).rejects.toThrow(
      "Apenas emails acadêmicos (@academico.ufpb.br) são permitidos."
    );
  });

  it("should allow master admin emails even if not academic domain", async () => {
    const input: RegisterInput = {
      nome: "Admin User",
      email: "admin@test.com",
      senha: "password123",
      centroId: "centro-1",
      cursoId: "curso-1",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue(null);
    mockDeps.centrosRepository.findById.mockResolvedValue({
      id: "centro-1",
      nome: "Centro",
      sigla: "C",
    });
    mockDeps.cursosRepository.findById.mockResolvedValue({
      id: "curso-1",
      nome: "Curso",
      centroId: "centro-1",
    });
    mockDeps.usuariosRepository.create.mockResolvedValue({
      id: "admin-123",
      papelPlataforma: "MASTER_ADMIN",
    } as any);

    const result = await register(input, mockDeps);

    expect(result.usuarioId).toBe("admin-123");
    const createCall = mockDeps.usuariosRepository.create.mock.calls[0][0];
    expect(createCall.papelPlataforma).toBe("MASTER_ADMIN");
  });

  it("should throw error if email is already registered", async () => {
    const input: RegisterInput = {
      nome: "Test User",
      email: "existing@academico.ufpb.br",
      senha: "password123",
      centroId: "centro-1",
      cursoId: "curso-1",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue({
      id: "existing-user",
    } as any);

    await expect(register(input, mockDeps)).rejects.toThrow(
      "Este e-mail já está em uso."
    );
  });

  it("should throw error if centro not found", async () => {
    const input: RegisterInput = {
      nome: "Test User",
      email: "test@academico.ufpb.br",
      senha: "password123",
      centroId: "invalid-centro",
      cursoId: "curso-1",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue(null);
    mockDeps.centrosRepository.findById.mockResolvedValue(null);

    await expect(register(input, mockDeps)).rejects.toThrow(
      "Centro não encontrado."
    );
  });

  it("should throw error if curso not found", async () => {
    const input: RegisterInput = {
      nome: "Test User",
      email: "test@academico.ufpb.br",
      senha: "password123",
      centroId: "centro-1",
      cursoId: "invalid-curso",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue(null);
    mockDeps.centrosRepository.findById.mockResolvedValue({
      id: "centro-1",
      nome: "Centro",
      sigla: "C",
    });
    mockDeps.cursosRepository.findById.mockResolvedValue(null);

    await expect(register(input, mockDeps)).rejects.toThrow(
      "Curso não encontrado."
    );
  });

  it("should throw error if curso does not belong to centro", async () => {
    const input: RegisterInput = {
      nome: "Test User",
      email: "test@academico.ufpb.br",
      senha: "password123",
      centroId: "centro-1",
      cursoId: "curso-1",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue(null);
    mockDeps.centrosRepository.findById.mockResolvedValue({
      id: "centro-1",
      nome: "Centro 1",
      sigla: "C1",
    });
    mockDeps.cursosRepository.findById.mockResolvedValue({
      id: "curso-1",
      nome: "Curso 1",
      centroId: "centro-2", // Different centro!
    });

    await expect(register(input, mockDeps)).rejects.toThrow(
      "O curso selecionado não pertence ao centro informado."
    );
  });

  it("should hash the password before storing", async () => {
    const input: RegisterInput = {
      nome: "Test User",
      email: "test@academico.ufpb.br",
      senha: "plaintext-password",
      centroId: "centro-1",
      cursoId: "curso-1",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue(null);
    mockDeps.centrosRepository.findById.mockResolvedValue({
      id: "centro-1",
      nome: "Centro",
      sigla: "C",
    });
    mockDeps.cursosRepository.findById.mockResolvedValue({
      id: "curso-1",
      nome: "Curso",
      centroId: "centro-1",
    });
    mockDeps.usuariosRepository.create.mockResolvedValue({
      id: "user-123",
    } as any);

    await register(input, mockDeps);

    expect(hash).toHaveBeenCalledWith("plaintext-password", 10);
    const createCall = mockDeps.usuariosRepository.create.mock.calls[0][0];
    expect(createCall.senhaHash).toBe("hashed-password");
  });

  it("should include optional photo URL if provided", async () => {
    const input: RegisterInput = {
      nome: "Test User",
      email: "test@academico.ufpb.br",
      senha: "password123",
      centroId: "centro-1",
      cursoId: "curso-1",
      urlFotoPerfil: "https://example.com/photo.jpg",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue(null);
    mockDeps.centrosRepository.findById.mockResolvedValue({
      id: "centro-1",
      nome: "Centro",
      sigla: "C",
    });
    mockDeps.cursosRepository.findById.mockResolvedValue({
      id: "curso-1",
      nome: "Curso",
      centroId: "centro-1",
    });
    mockDeps.usuariosRepository.create.mockResolvedValue({
      id: "user-123",
    } as any);

    await register(input, mockDeps);

    const createCall = mockDeps.usuariosRepository.create.mock.calls[0][0];
    expect(createCall.urlFotoPerfil).toBe("https://example.com/photo.jpg");
  });

  it("should not fail registration if email sending fails", async () => {
    const input: RegisterInput = {
      nome: "Test User",
      email: "test@academico.ufpb.br",
      senha: "password123",
      centroId: "centro-1",
      cursoId: "curso-1",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue(null);
    mockDeps.centrosRepository.findById.mockResolvedValue({
      id: "centro-1",
      nome: "Centro",
      sigla: "C",
    });
    mockDeps.cursosRepository.findById.mockResolvedValue({
      id: "curso-1",
      nome: "Curso",
      centroId: "centro-1",
    });
    mockDeps.usuariosRepository.create.mockResolvedValue({
      id: "user-123",
    } as any);
    mockDeps.emailService.sendVerificationEmail.mockRejectedValue(
      new Error("Email service error")
    );

    // Should not throw
    const result = await register(input, mockDeps);

    expect(result.usuarioId).toBe("user-123");
  });

  it("should create verification token with 24 hour expiration", async () => {
    const input: RegisterInput = {
      nome: "Test User",
      email: "test@academico.ufpb.br",
      senha: "password123",
      centroId: "centro-1",
      cursoId: "curso-1",
    };

    mockDeps.usuariosRepository.findByEmail.mockResolvedValue(null);
    mockDeps.centrosRepository.findById.mockResolvedValue({
      id: "centro-1",
      nome: "Centro",
      sigla: "C",
    });
    mockDeps.cursosRepository.findById.mockResolvedValue({
      id: "curso-1",
      nome: "Curso",
      centroId: "centro-1",
    });
    mockDeps.usuariosRepository.create.mockResolvedValue({
      id: "user-123",
    } as any);

    const beforeTime = new Date(Date.now() + 24 * 60 * 60 * 1000 - 1000);
    await register(input, mockDeps);
    const afterTime = new Date(Date.now() + 24 * 60 * 60 * 1000 + 1000);

    expect(mockDeps.tokenVerificacaoRepository.create).toHaveBeenCalled();
    const tokenCall = mockDeps.tokenVerificacaoRepository.create.mock.calls[0][0];
    expect(tokenCall.usuarioId).toBe("user-123");
    expect(tokenCall.tipo).toBe("VERIFICACAO_EMAIL");
    expect(tokenCall.token).toHaveLength(64); // 32 bytes hex = 64 chars
    expect(tokenCall.expiraEm.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(tokenCall.expiraEm.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });
});
