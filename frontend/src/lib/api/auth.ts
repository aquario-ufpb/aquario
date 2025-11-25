const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
  papel: 'DISCENTE' | 'DOCENTE';
  centroId: string;
  bio?: string;
  urlFotoPerfil?: string;
  cursoId?: string;
  periodo?: number;
}

export interface AuthResponse {
  user: {
    id: string;
    nome: string;
    email: string;
    papel: 'DISCENTE' | 'DOCENTE';
    papelPlataforma: 'USER' | 'MASTER_ADMIN';
    urlFotoPerfil?: string | null;
    periodo?: number | null;
    bio?: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  },
};
