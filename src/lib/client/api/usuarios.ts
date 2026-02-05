import { ENDPOINTS } from "@/lib/shared/config/constants";
import { apiClient } from "./api-client";
import { throwApiError } from "@/lib/client/errors";

export type User = {
  id: string;
  nome: string;
  email: string | null;
  slug?: string | null;
  papelPlataforma: "USER" | "MASTER_ADMIN";
  eVerificado: boolean;
  eFacade?: boolean;
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

export type CreateFacadeUserRequest = {
  nome: string;
  centroId: string;
  cursoId: string;
};

export type UpdateUserInfoRequest = {
  centroId?: string;
  cursoId?: string;
};

export type UserMembership = {
  id: string;
  entidade: {
    id: string;
    nome: string;
    slug: string | null;
    tipo: string;
    urlFoto: string | null;
    centro: {
      id: string;
      nome: string;
      sigla: string;
    };
  };
  papel: "ADMIN" | "MEMBRO";
  cargo: {
    id: string;
    nome: string;
    descricao: string | null;
    ordem: number;
  } | null;
  startedAt: string;
  endedAt: string | null;
};

export const usuariosService = {
  getCurrentUser: async (token: string): Promise<User> => {
    const response = await apiClient(`${ENDPOINTS.ME}`, {
      method: "GET",
      token,
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    return response.json();
  },

  getBySlug: async (slug: string): Promise<User> => {
    const response = await apiClient(`${ENDPOINTS.USUARIO_BY_SLUG(slug)}`, {
      method: "GET",
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    return response.json();
  },

  listUsersPaginated: async (
    token: string,
    options: { page?: number; limit?: number; filter?: "all" | "facade" | "real"; search?: string }
  ): Promise<{
    users: User[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> => {
    const params = new URLSearchParams();
    if (options.page) {
      params.append("page", options.page.toString());
    }
    if (options.limit) {
      params.append("limit", options.limit.toString());
    }
    if (options.filter && options.filter !== "all") {
      params.append("filter", options.filter);
    }
    if (options.search) {
      params.append("search", options.search);
    }

    const response = await apiClient(`${ENDPOINTS.USUARIOS}?${params.toString()}`, {
      method: "GET",
      token,
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    return response.json();
  },

  searchUsers: async (token: string, query: string, limit?: number): Promise<User[]> => {
    const params = new URLSearchParams();
    params.append("search", query);
    if (limit) {
      params.append("limit", limit.toString());
    }

    const response = await apiClient(`${ENDPOINTS.USUARIOS}?${params.toString()}`, {
      method: "GET",
      token,
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    return response.json();
  },

  updateUserRole: async (
    userId: string,
    papelPlataforma: "USER" | "MASTER_ADMIN",
    token: string
  ): Promise<User> => {
    const response = await apiClient(`${ENDPOINTS.USUARIOS}/${userId}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      token,
      body: JSON.stringify({ papelPlataforma }),
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    return response.json();
  },

  deleteUser: async (userId: string, token: string): Promise<void> => {
    const response = await apiClient(`${ENDPOINTS.USUARIOS}/${userId}`, {
      method: "DELETE",
      token,
    });

    if (!response.ok) {
      await throwApiError(response);
    }
  },

  uploadPhoto: async (file: File, token: string): Promise<User> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient(`${ENDPOINTS.UPLOAD_PHOTO}`, {
      method: "POST",
      token,
      body: formData,
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    // Upload route now returns the updated user object directly
    return response.json();
  },

  updatePhoto: async (urlFotoPerfil: string | null, token: string): Promise<User> => {
    const response = await apiClient(`${ENDPOINTS.USUARIO_PHOTO}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      token,
      body: JSON.stringify({ urlFotoPerfil }),
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    return response.json();
  },

  deletePhoto: async (token: string): Promise<User> => {
    const response = await apiClient(`${ENDPOINTS.USUARIO_PHOTO}`, {
      method: "DELETE",
      token,
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    return response.json();
  },

  createFacadeUser: async (data: CreateFacadeUserRequest, token: string): Promise<User> => {
    const response = await apiClient(`${ENDPOINTS.USUARIOS}/facade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      token,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    return response.json();
  },

  updateUserInfo: async (
    userId: string,
    data: UpdateUserInfoRequest,
    token: string
  ): Promise<User> => {
    const response = await apiClient(`${ENDPOINTS.USUARIOS}/${userId}/info`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      token,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    return response.json();
  },

  updateUserSlug: async (userId: string, slug: string | null, token: string): Promise<User> => {
    const response = await apiClient(`${ENDPOINTS.USUARIOS}/${userId}/slug`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      token,
      body: JSON.stringify({ slug }),
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    return response.json();
  },

  getMyMemberships: async (token: string): Promise<UserMembership[]> => {
    const response = await apiClient(`${ENDPOINTS.USUARIO_MEMBROS_ME}`, {
      method: "GET",
      token,
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    return response.json();
  },

  getUserMemberships: async (userId: string): Promise<UserMembership[]> => {
    const response = await apiClient(`${ENDPOINTS.USUARIO_MEMBROS(userId)}`, {
      method: "GET",
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    return response.json();
  },

  mergeFacadeUser: async (
    facadeUserId: string,
    realUserId: string,
    deleteFacade: boolean,
    token: string
  ): Promise<{
    success: boolean;
    membershipsCopied: number;
    conflicts: number;
    facadeUserDeleted: boolean;
  }> => {
    const response = await apiClient(`${ENDPOINTS.MERGE_FACADE_USER}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      token,
      body: JSON.stringify({
        facadeUserId,
        realUserId,
        deleteFacade,
      }),
    });

    if (!response.ok) {
      await throwApiError(response);
    }

    return response.json();
  },
};
