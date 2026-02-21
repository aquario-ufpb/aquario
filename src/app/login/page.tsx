"use client";

import React, { useState, FormEvent, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authService } from "@/lib/client/api/auth";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/auth/password-input";

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    <AuthLayout>
      <div className="text-center mb-8 md:mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Bem-vindo de volta</h1>
        <p className="text-muted-foreground">Faça login para acessar sua conta</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8">
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
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
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Senha
                </Label>
                <Link
                  href="/esqueci-senha"
                  className="text-sm text-aquario-primary hover:text-aquario-primary/80 transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <PasswordInput
                id="password"
                placeholder="Sua senha"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                disabled={isLoading}
                className="h-12"
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
            className="w-full h-12 bg-aquario-primary hover:bg-aquario-primary/90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <Link
              href="/registro"
              className="font-semibold text-aquario-primary hover:text-aquario-primary/80 transition-colors"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aquario-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando...</p>
          </div>
        </AuthLayout>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
