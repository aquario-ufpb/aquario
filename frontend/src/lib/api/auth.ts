import { API_URL, ENDPOINTS } from "../config/constants";
import { apiClient } from "./api-client";

export type LoginResponse = {
  token: string;
};

export type RegisterRequest = {
  nome: string;
  email: string;
  senha: string;
  centroId: string;
  cursoId: string;
  urlFotoPerfil?: string;
};

export type RegisterResponse = {
  message: string;
  usuarioId: string;
  verificado: boolean;
};

export type VerifyEmailRequest = {
  token: string;
};

export type VerifyEmailResponse = {
  success: boolean;
  message: string;
};

export type ResendVerificationResponse = {
  success: boolean;
  message: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ForgotPasswordResponse = {
  success: boolean;
  message: string;
};

export type ResetPasswordRequest = {
  token: string;
  novaSenha: string;
};

export type ResetPasswordResponse = {
  success: boolean;
  message: string;
};

export type RefreshTokenResponse = {
  token: string;
};

export const authService = {
  login: async (email: string, senha: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_URL}${ENDPOINTS.LOGIN}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, senha }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Falha no login");
    }

    return response.json();
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await fetch(`${API_URL}${ENDPOINTS.REGISTER}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Falha no registro");
    }

    return response.json();
  },

  verifyEmail: async (token: string): Promise<VerifyEmailResponse> => {
    const response = await fetch(`${API_URL}${ENDPOINTS.VERIFY_EMAIL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Falha ao verificar email");
    }

    return response.json();
  },

  resendVerification: async (token: string): Promise<ResendVerificationResponse> => {
    const response = await apiClient(`${API_URL}${ENDPOINTS.RESEND_VERIFICATION}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      token, // Still accept token for explicit override if needed
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Falha ao reenviar verificação");
    }

    return response.json();
  },

  requestResendVerification: async (email: string): Promise<ResendVerificationResponse> => {
    const response = await fetch(`${API_URL}${ENDPOINTS.REQUEST_RESEND_VERIFICATION}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    // Always return success for security (prevent email enumeration)
    if (!response.ok) {
      // Still return success even if there's an error
      return {
        success: true,
        message:
          "Se o email estiver cadastrado e não verificado, você receberá um novo email de verificação.",
      };
    }

    return response.json();
  },

  forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
    const response = await fetch(`${API_URL}${ENDPOINTS.FORGOT_PASSWORD}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    // Always return success for security (prevent email enumeration)
    if (!response.ok) {
      // Still return success even if there's an error
      return {
        success: true,
        message:
          "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.",
      };
    }

    return response.json();
  },

  resetPassword: async (token: string, novaSenha: string): Promise<ResetPasswordResponse> => {
    const response = await fetch(`${API_URL}${ENDPOINTS.RESET_PASSWORD}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, novaSenha }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Falha ao resetar senha");
    }

    return response.json();
  },

  refreshToken: async (currentToken: string): Promise<RefreshTokenResponse> => {
    const response = await fetch(`${API_URL}${ENDPOINTS.REFRESH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Falha ao renovar token");
    }

    return response.json();
  },
};
