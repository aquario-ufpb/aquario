"use client";

import React, { useState, FormEvent, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authService } from "@/lib/api/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const registered = searchParams.get("registered");
    const verify = searchParams.get("verify");
    const reset = searchParams.get("reset");

    if (registered === "true") {
      setSuccess("Conta criada com sucesso! Você já pode fazer login.");
    } else if (verify === "true") {
      setSuccess("Verifique seu email para ativar sua conta.");
    } else if (reset === "true") {
      setSuccess("Senha redefinida com sucesso! Faça login com sua nova senha.");
    }
  }, [searchParams]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await authService.login(email, senha);
      login(data.token);
      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Handle specific error codes from backend
        if (err.message === "EMAIL_NAO_ENCONTRADO") {
          setError("Este email não está cadastrado. Verifique o email ou crie uma conta.");
        } else if (err.message === "SENHA_INVALIDA") {
          setError("Senha incorreta. Tente novamente ou recupere sua senha.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Ocorreu um erro desconhecido");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4 mt-20">
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
            Bem-vindo de volta
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Faça login para acessar sua conta</p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@academico.ufpb.br"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Senha
                  </Label>
                  <Link
                    href="/esqueci-senha"
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                {error.includes("não verificado") && (
                  <p className="text-xs text-red-500 dark:text-red-400 text-center mt-2">
                    Verifique sua caixa de entrada ou{" "}
                    <Link href="/verificar-email" className="underline">
                      solicite um novo email de verificação
                    </Link>
                  </p>
                )}
                {error.includes("não está cadastrado") && (
                  <p className="text-xs text-red-500 dark:text-red-400 text-center mt-2">
                    <Link href="/registro" className="underline font-semibold">
                      Criar uma conta
                    </Link>
                  </p>
                )}
                {error.includes("Senha incorreta") && (
                  <p className="text-xs text-red-500 dark:text-red-400 text-center mt-2">
                    <Link href="/esqueci-senha" className="underline">
                      Esqueci minha senha
                    </Link>
                  </p>
                )}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400 text-center">{success}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Não tem uma conta?{" "}
              <Link
                href="/registro"
                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Criar conta
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
