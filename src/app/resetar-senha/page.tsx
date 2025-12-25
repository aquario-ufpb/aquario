"use client";

import React, { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authService } from "@/lib/client/api/auth";

function ResetarSenhaForm() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("Token inválido ou ausente");
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (novaSenha.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    if (novaSenha.length > 128) {
      setError("A senha deve ter no máximo 128 caracteres");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError("As senhas não coincidem");
      return;
    }

    if (!token) {
      setError("Token inválido");
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(token, novaSenha);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login?reset=true");
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Falha ao resetar senha. Tente novamente.");
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
                Senha redefinida!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Sua senha foi redefinida com sucesso. Redirecionando para o login...
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
            <Image
              src="/logo.png"
              alt="Logo do Aquário"
              width={64}
              height={64}
              className="rounded-full"
            />
          </div>
          <h1 className="text-3xl font-bold text-aquario-primary dark:text-white mb-2">
            Redefinir senha
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Digite sua nova senha abaixo</p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="novaSenha"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Nova senha
                </Label>
                <Input
                  id="novaSenha"
                  type="password"
                  placeholder="Mínimo de 8 caracteres"
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  required
                  disabled={isLoading || !token}
                  minLength={8}
                  maxLength={128}
                  className="h-12 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="confirmarSenha"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Confirmar senha
                </Label>
                <Input
                  id="confirmarSenha"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={confirmarSenha}
                  onChange={e => setConfirmarSenha(e.target.value)}
                  required
                  disabled={isLoading || !token}
                  minLength={8}
                  maxLength={128}
                  className="h-12 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !token}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Redefinindo..." : "Redefinir senha"}
            </Button>
          </form>

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

export default function ResetarSenha() {
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
      <ResetarSenhaForm />
    </Suspense>
  );
}
