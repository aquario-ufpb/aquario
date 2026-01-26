import { formatUserResponse } from "../format-user-response";
import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";

describe("formatUserResponse", () => {
  it("should format a complete user object for API responses", () => {
    const mockUser: UsuarioWithRelations = {
      id: "user-123",
      nome: "João Silva",
      email: "joao@example.com",
      senhaHash: "hashed-password",
      papelPlataforma: "USUARIO",
      eVerificado: true,
      urlFotoPerfil: "https://example.com/photo.jpg",
      centroId: "centro-1",
      cursoId: "curso-1",
      dataCadastro: new Date("2024-01-01"),
      centro: {
        id: "centro-1",
        nome: "Centro de Informática",
        sigla: "CI",
      },
      curso: {
        id: "curso-1",
        nome: "Ciência da Computação",
        centroId: "centro-1",
      },
      permissoes: [],
    };

    const result = formatUserResponse(mockUser);

    expect(result).toEqual({
      id: "user-123",
      nome: "João Silva",
      email: "joao@example.com",
      papelPlataforma: "USUARIO",
      eVerificado: true,
      urlFotoPerfil: "https://example.com/photo.jpg",
      centro: {
        id: "centro-1",
        nome: "Centro de Informática",
        sigla: "CI",
      },
      curso: {
        id: "curso-1",
        nome: "Ciência da Computação",
      },
      permissoes: [],
    });
  });

  it("should not include sensitive data like senhaHash", () => {
    const mockUser: UsuarioWithRelations = {
      id: "user-456",
      nome: "Maria Santos",
      email: "maria@example.com",
      senhaHash: "very-secret-hash",
      papelPlataforma: "MASTER_ADMIN",
      eVerificado: true,
      urlFotoPerfil: null,
      centroId: "centro-2",
      cursoId: "curso-2",
      dataCadastro: new Date("2024-02-01"),
      centro: {
        id: "centro-2",
        nome: "Centro de Tecnologia",
        sigla: "CT",
      },
      curso: {
        id: "curso-2",
        nome: "Engenharia da Computação",
        centroId: "centro-2",
      },
      permissoes: [
        {
          id: "perm-1",
          usuarioId: "user-456",
          entidadeId: "ent-1",
          papel: "ADMINISTRADOR",
          dataCriacao: new Date(),
        },
      ],
    };

    const result = formatUserResponse(mockUser);

    expect(result).not.toHaveProperty("senhaHash");
    expect(result).not.toHaveProperty("centroId");
    expect(result).not.toHaveProperty("cursoId");
    expect(result).not.toHaveProperty("dataCadastro");
  });

  it("should handle users with null urlFotoPerfil", () => {
    const mockUser: UsuarioWithRelations = {
      id: "user-789",
      nome: "Pedro Oliveira",
      email: "pedro@example.com",
      senhaHash: "hash",
      papelPlataforma: "USUARIO",
      eVerificado: false,
      urlFotoPerfil: null,
      centroId: "centro-1",
      cursoId: "curso-1",
      dataCadastro: new Date(),
      centro: {
        id: "centro-1",
        nome: "Centro de Ciências Exatas",
        sigla: "CCE",
      },
      curso: {
        id: "curso-1",
        nome: "Matemática",
        centroId: "centro-1",
      },
      permissoes: [],
    };

    const result = formatUserResponse(mockUser);

    expect(result.urlFotoPerfil).toBeNull();
  });

  it("should include user permissions in response", () => {
    const mockUser: UsuarioWithRelations = {
      id: "user-999",
      nome: "Ana Costa",
      email: "ana@example.com",
      senhaHash: "hash",
      papelPlataforma: "USUARIO",
      eVerificado: true,
      urlFotoPerfil: null,
      centroId: "centro-1",
      cursoId: "curso-1",
      dataCadastro: new Date(),
      centro: {
        id: "centro-1",
        nome: "Centro de Educação",
        sigla: "CE",
      },
      curso: {
        id: "curso-1",
        nome: "Pedagogia",
        centroId: "centro-1",
      },
      permissoes: [
        {
          id: "perm-1",
          usuarioId: "user-999",
          entidadeId: "ent-1",
          papel: "EDITOR",
          dataCriacao: new Date("2024-01-15"),
        },
        {
          id: "perm-2",
          usuarioId: "user-999",
          entidadeId: "ent-2",
          papel: "ADMINISTRADOR",
          dataCriacao: new Date("2024-02-01"),
        },
      ],
    };

    const result = formatUserResponse(mockUser);

    expect(result.permissoes).toHaveLength(2);
    expect(result.permissoes[0].papel).toBe("EDITOR");
    expect(result.permissoes[1].papel).toBe("ADMINISTRADOR");
  });
});
