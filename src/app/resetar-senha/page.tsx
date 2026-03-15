"use client";

import React, { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authService } from "@/lib/client/api/auth";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/auth/password-input";
import { trackEvent } from "@/analytics/posthog-client";

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
    trackEvent("reset_password_submitted");

    try {
      await authService.resetPassword(token, novaSenha);
      trackEvent("reset_password_succeeded");
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
      <AuthLayout>
        <div className="rounded-2xl border border-border bg-card p-8">
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
            <h1 className="text-2xl font-bold text-foreground mb-2">Senha redefinida!</h1>
            <p className="text-muted-foreground mb-6">
              Sua senha foi redefinida com sucesso. Redirecionando para o login...
            </p>
            <Link href="/login">
              <Button className="w-full bg-aquario-primary hover:bg-aquario-primary/90 text-white">
                Ir para o login
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="text-center mb-8 md:mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Redefinir senha</h1>
        <p className="text-muted-foreground">Digite sua nova senha abaixo</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="novaSenha" className="text-sm font-medium text-foreground">
                Nova senha
              </Label>
              <PasswordInput
                id="novaSenha"
                placeholder="Mínimo de 8 caracteres"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                required
                disabled={isLoading || !token}
                minLength={8}
                maxLength={128}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha" className="text-sm font-medium text-foreground">
                Confirmar senha
              </Label>
              <PasswordInput
                id="confirmarSenha"
                placeholder="Digite a senha novamente"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                required
                disabled={isLoading || !token}
                minLength={8}
                maxLength={128}
                className="h-12"
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
            className="w-full h-12 bg-aquario-primary hover:bg-aquario-primary/90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Redefinindo..." : "Redefinir senha"}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-semibold text-aquario-primary hover:text-aquario-primary/80 transition-colors"
            >
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function ResetarSenha() {
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
      <ResetarSenhaForm />
    </Suspense>
  );
}
