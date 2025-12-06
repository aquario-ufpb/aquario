"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/api/auth";
import { useAuth } from "@/contexts/auth-context";

function VerificarEmailForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const { token, user } = useAuth();

  const handleVerify = React.useCallback(
    async (verifyToken: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await authService.verifyEmail(verifyToken);
        if (result.success) {
          setSuccess(true);
          // Refresh user data if logged in
          if (token) {
            window.location.reload();
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Falha ao verificar email");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      handleVerify(tokenParam);
    }
  }, [searchParams, handleVerify]);

  const handleResend = async () => {
    if (!token) {
      setError("Você precisa estar logado para reenviar o email de verificação");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.resendVerification(token);
      setSuccess(true);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Falha ao reenviar email de verificação");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <svg
                    className="w-12 h-12 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Email verificado!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Seu email foi verificado com sucesso. Você já pode fazer login.
              </p>
              <Link href="/login">
                <Button className="w-full">Ir para o login</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-lg">
              <Image
                src="/logo.png"
                alt="Logo do Aquário"
                width={64}
                height={64}
                className="rounded-full"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-aquario-primary dark:text-white mb-2">
            Verificar email
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {searchParams.get("token")
              ? "Verificando seu email..."
              : "Verifique seu email ou solicite um novo link"}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          {isLoading && !searchParams.get("token") ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Verificando...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 text-center mb-2">{error}</p>
                  {error.includes("expirado") && token && (
                    <Button
                      onClick={handleResend}
                      variant="outline"
                      className="w-full mt-2"
                      disabled={isLoading}
                    >
                      Reenviar email de verificação
                    </Button>
                  )}
                </div>
              )}

              {!searchParams.get("token") && (
                <div className="space-y-4">
                  <p className="text-center text-gray-600 dark:text-gray-400">
                    {user && !user.eVerificado
                      ? "Seu email ainda não foi verificado. Clique no botão abaixo para reenviar o email de verificação."
                      : "Você precisa de um token de verificação. Verifique seu email ou faça login para solicitar um novo link."}
                  </p>
                  {token && user && !user.eVerificado && (
                    <Button onClick={handleResend} className="w-full" disabled={isLoading}>
                      {isLoading ? "Enviando..." : "Reenviar email de verificação"}
                    </Button>
                  )}
                  {!token && (
                    <Link href="/login">
                      <Button className="w-full">Ir para o login</Button>
                    </Link>
                  )}
                </div>
              )}
            </>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Voltar para o login
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500 dark:text-gray-400">Centro de Informática - UFPB</p>
        </div>
      </div>
    </div>
  );
}

export default function VerificarEmail() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
            </div>
          </div>
        </div>
      }
    >
      <VerificarEmailForm />
    </Suspense>
  );
}
