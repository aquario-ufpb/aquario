import { API_URL, ENDPOINTS } from "../config/constants";

export type User = {
  id: string;
  nome: string;
  email: string;
  papelPlataforma: "USER" | "MASTER_ADMIN";
  eVerificado: boolean;
  urlFotoPerfil?: string | null;
  centro: {
    id: string;
    nome: string;
    sigla: string;
  };
  curso: {
    id: string;
    nome: string;
  };
  permissoes: string[];
};

export type UpdateUserRoleRequest = {
  papelPlataforma: "USER" | "MASTER_ADMIN";
};

export const usuariosService = {
  getCurrentUser: async (token: string): Promise<User> => {
    const response = await fetch(`${API_URL}${ENDPOINTS.ME}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Falha ao buscar usuário");
    }

    return response.json();
  },

  listUsers: async (token: string): Promise<User[]> => {
    const response = await fetch(`${API_URL}${ENDPOINTS.USUARIOS}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Falha ao listar usuários");
    }

    return response.json();
  },

  updateUserRole: async (
    userId: string,
    papelPlataforma: "USER" | "MASTER_ADMIN",
    token: string
  ): Promise<User> => {
    // Note: This endpoint may need to be created in the backend
    // For now, this is a placeholder that follows the expected pattern
    const response = await fetch(`${API_URL}${ENDPOINTS.USUARIOS}/${userId}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ papelPlataforma }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Falha ao atualizar papel do usuário");
    }

    return response.json();
  },
};
