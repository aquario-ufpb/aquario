import { withAuth, withAdmin, getOptionalUser } from "../middleware";
import { verifyToken } from "@/lib/server/services/jwt/jwt";
import { getContainer } from "@/lib/server/container";
import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";
import { NextResponse } from "next/server";

// Mock Next.js modules first
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data: any, init?: any) => {
      const response = {
        status: init?.status || 200,
        json: async () => data,
      };
      return response;
    }),
  },
}));

// Mock dependencies
jest.mock("@/lib/server/services/jwt/jwt");
jest.mock("@/lib/server/container");

describe("Auth Middleware", () => {
  let mockUsuariosRepository: any;
  let mockUser: UsuarioWithRelations;
  let mockRequest: Request;
  let mockHandler: jest.Mock;

  beforeEach(() => {
    mockUser = {
      id: "user-123",
      nome: "Test User",
      email: "test@example.com",
      senhaHash: "hash",
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
      findById: jest.fn(),
    };

    (getContainer as jest.Mock).mockReturnValue({
      usuariosRepository: mockUsuariosRepository,
    });

    mockHandler = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ success: true }),
    });

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("withAuth", () => {
    it("should call handler with user when valid token provided", async () => {
      const token = "valid-token";
      const mockHeaders = new Map();
      mockHeaders.set("authorization", `Bearer ${token}`);
      
      mockRequest = {
        headers: {
          get: (name: string) => mockHeaders.get(name.toLowerCase()) || null,
        },
      } as any;

      (verifyToken as jest.Mock).mockReturnValue({ sub: "user-123" });
      mockUsuariosRepository.findById.mockResolvedValue(mockUser);

      const response = await withAuth(mockRequest, mockHandler);

      expect(verifyToken).toHaveBeenCalledWith(token);
      expect(mockUsuariosRepository.findById).toHaveBeenCalledWith("user-123");
      expect(mockHandler).toHaveBeenCalledWith(mockRequest, mockUser);
      expect(response).toBeDefined();
    });

    it("should return 401 when no token provided", async () => {
      mockRequest = {
        headers: {
          get: () => null,
        },
      } as any;

      const response = await withAuth(mockRequest, mockHandler);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Token não fornecido");
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should return 401 when Authorization header is malformed", async () => {
      mockRequest = {
        headers: {
          get: (name: string) => name.toLowerCase() === "authorization" ? "InvalidFormat token" : null,
        },
      } as any;

      const response = await withAuth(mockRequest, mockHandler);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Token não fornecido");
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should return 401 when token is invalid", async () => {
      mockRequest = {
        headers: {
          get: (name: string) => name.toLowerCase() === "authorization" ? "Bearer invalid-token" : null,
        },
      } as any;

      (verifyToken as jest.Mock).mockReturnValue(null);

      const response = await withAuth(mockRequest, mockHandler);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Token inválido ou expirado");
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should return 401 when user not found", async () => {
      mockRequest = {
        headers: {
          get: (name: string) => name.toLowerCase() === "authorization" ? "Bearer valid-token" : null,
        },
      } as any;

      (verifyToken as jest.Mock).mockReturnValue({ sub: "user-123" });
      mockUsuariosRepository.findById.mockResolvedValue(null);

      const response = await withAuth(mockRequest, mockHandler);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Usuário não encontrado");
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should extract token correctly from Bearer header", async () => {
      const token = "my-secret-token-123";
      mockRequest = {
        headers: {
          get: (name: string) => name.toLowerCase() === "authorization" ? `Bearer ${token}` : null,
        },
      } as any;

      (verifyToken as jest.Mock).mockReturnValue({ sub: "user-123" });
      mockUsuariosRepository.findById.mockResolvedValue(mockUser);

      await withAuth(mockRequest, mockHandler);

      expect(verifyToken).toHaveBeenCalledWith(token);
    });
  });

  describe("withAdmin", () => {
    it("should call handler when user is MASTER_ADMIN", async () => {
      const adminUser = { ...mockUser, papelPlataforma: "MASTER_ADMIN" as const };
      mockRequest = {
        headers: {
          get: (name: string) => name.toLowerCase() === "authorization" ? "Bearer valid-token" : null,
        },
      } as any;

      (verifyToken as jest.Mock).mockReturnValue({ sub: "admin-123" });
      mockUsuariosRepository.findById.mockResolvedValue(adminUser);

      const response = await withAdmin(mockRequest, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, adminUser);
      expect(response).toBeDefined();
    });

    it("should return 403 when user is not MASTER_ADMIN", async () => {
      mockRequest = {
        headers: {
          get: (name: string) => name.toLowerCase() === "authorization" ? "Bearer valid-token" : null,
        },
      } as any;

      (verifyToken as jest.Mock).mockReturnValue({ sub: "user-123" });
      mockUsuariosRepository.findById.mockResolvedValue(mockUser);

      const response = await withAdmin(mockRequest, mockHandler);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toContain("Acesso negado");
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should return 401 when no token provided", async () => {
      mockRequest = {
        headers: {
          get: () => null,
        },
      } as any;

      const response = await withAdmin(mockRequest, mockHandler);

      expect(response.status).toBe(401);
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe("getOptionalUser", () => {
    it("should return user when valid token provided", async () => {
      mockRequest = {
        headers: {
          get: (name: string) => name.toLowerCase() === "authorization" ? "Bearer valid-token" : null,
        },
      } as any;

      (verifyToken as jest.Mock).mockReturnValue({ sub: "user-123" });
      mockUsuariosRepository.findById.mockResolvedValue(mockUser);

      const user = await getOptionalUser(mockRequest);

      expect(user).toEqual(mockUser);
      expect(verifyToken).toHaveBeenCalled();
      expect(mockUsuariosRepository.findById).toHaveBeenCalledWith("user-123");
    });

    it("should return null when no token provided", async () => {
      mockRequest = {
        headers: {
          get: () => null,
        },
      } as any;

      const user = await getOptionalUser(mockRequest);

      expect(user).toBeNull();
      expect(verifyToken).not.toHaveBeenCalled();
    });

    it("should return null when token is invalid", async () => {
      mockRequest = {
        headers: {
          get: (name: string) => name.toLowerCase() === "authorization" ? "Bearer invalid-token" : null,
        },
      } as any;

      (verifyToken as jest.Mock).mockReturnValue(null);

      const user = await getOptionalUser(mockRequest);

      expect(user).toBeNull();
      expect(mockUsuariosRepository.findById).not.toHaveBeenCalled();
    });

    it("should return null when user not found", async () => {
      mockRequest = {
        headers: {
          get: (name: string) => name.toLowerCase() === "authorization" ? "Bearer valid-token" : null,
        },
      } as any;

      (verifyToken as jest.Mock).mockReturnValue({ sub: "user-123" });
      mockUsuariosRepository.findById.mockResolvedValue(null);

      const user = await getOptionalUser(mockRequest);

      expect(user).toBeNull();
    });
  });
});
