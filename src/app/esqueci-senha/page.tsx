"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authService } from "@/lib/client/api/auth";
import { AuthLayout } from "@/components/auth/auth-layout";
import { trackEvent } from "@/analytics/posthog-client";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      trackEvent("forgot_password_submitted");
      setSuccess(true);
    } catch (_err) {
      // Even on error, show success for security (prevent email enumeration)
      trackEvent("forgot_password_submitted");
      setSuccess(true);
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
            <h1 className="text-2xl font-bold text-foreground mb-2">Email enviado!</h1>
            <p className="text-muted-foreground mb-6">
              Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.
            </p>
            <Link href="/login">
              <Button className="w-full bg-aquario-primary hover:bg-aquario-primary/90 text-white">
                Voltar para o login
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Esqueci minha senha</h1>
        <p className="text-muted-foreground">
          Digite seu email para receber instruções de redefinição
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-aquario-primary hover:bg-aquario-primary/90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Enviando..." : "Enviar instruções"}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            Lembrou sua senha?{" "}
            <Link
              href="/login"
              className="font-semibold text-aquario-primary hover:text-aquario-primary/80 transition-colors"
            >
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
