"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authService } from "@/lib/client/api/auth";
import { useAllCursos } from "@/lib/client/hooks";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/auth/password-input";
import { trackEvent } from "@/analytics/posthog-client";
import {
  cursoIllustrations,
  cursoShortLabels,
  OutroIllustration,
} from "@/components/auth/curso-illustrations";
import { cn } from "@/lib/client/utils";

export default function Registro() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [cursoId, setCursoId] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: cursos = [], isLoading: isLoadingCursos } = useAllCursos();

  // Split cursos into known (with illustrations) and unknown
  const knownCursos = cursos.filter(c => c.nome in cursoIllustrations);
  const unknownCursos = cursos.filter(c => !(c.nome in cursoIllustrations));

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    trackEvent("register_attempted");

    const selectedCurso = cursos.find(c => c.id === cursoId);
    if (!selectedCurso) {
      setError("Selecione um curso válido.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await authService.register({
        nome,
        email,
        senha,
        centroId: selectedCurso.centroId,
        cursoId,
      });

      trackEvent("register_succeeded");
      if (result.verificado) {
        setSuccess(result.message);
        setTimeout(() => {
          router.push("/login?registered=true");
        }, 2000);
      } else {
        setSuccess(result.message);
        setTimeout(() => {
          router.push("/login?verify=true");
        }, 3000);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        trackEvent("register_failed", { error_type: err.message });
        setError(err.message);
      } else {
        trackEvent("register_failed", { error_type: "unknown" });
        setError("Ocorreu um erro desconhecido");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-8 md:mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Crie sua conta</h1>
        <p className="text-muted-foreground">Preencha os campos para se registrar</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8">
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium text-foreground">
                Nome Completo
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
                disabled={isLoading}
                className="h-12"
                placeholder="Seu nome completo"
              />
            </div>

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
              <p className="text-xs text-muted-foreground">
                Apenas emails @academico.ufpb.br são permitidos
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Senha
              </Label>
              <PasswordInput
                id="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
                className="h-12"
                placeholder="Mínimo de 8 caracteres"
              />
              <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres</p>
            </div>

            {/* Curso selection — illustrated buttons */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Curso</Label>

              {isLoadingCursos ? (
                <div className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square animate-pulse rounded-xl border border-border bg-muted"
                    />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-5 gap-1.5">
                    {knownCursos.map(curso => {
                      const Illustration = cursoIllustrations[curso.nome] ?? OutroIllustration;
                      const label = cursoShortLabels[curso.nome] ?? curso.nome;
                      const selected = cursoId === curso.id;

                      return (
                        <button
                          key={curso.id}
                          type="button"
                          disabled={isLoading}
                          onClick={() => setCursoId(selected ? "" : curso.id)}
                          className={cn(
                            "group flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border-2 p-1 transition-all",
                            selected
                              ? "border-aquario-primary bg-aquario-primary/5 text-aquario-primary"
                              : "border-border bg-card text-muted-foreground hover:border-aquario-primary/40 hover:text-foreground"
                          )}
                        >
                          <Illustration className="h-5 w-5" />
                          <span className="text-[10px] font-medium leading-tight text-center">
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Unknown / "Outro" cursos as simpler row */}
                  {unknownCursos.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {unknownCursos.map(curso => {
                        const selected = cursoId === curso.id;
                        return (
                          <button
                            key={curso.id}
                            type="button"
                            disabled={isLoading}
                            onClick={() => setCursoId(selected ? "" : curso.id)}
                            className={cn(
                              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                              selected
                                ? "border-aquario-primary bg-aquario-primary/5 text-aquario-primary"
                                : "border-border text-muted-foreground hover:border-aquario-primary/40 hover:text-foreground"
                            )}
                          >
                            {curso.nome}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 text-center">{success}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !cursoId}
            className="w-full h-12 bg-aquario-primary hover:bg-aquario-primary/90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Registrando..." : "Criar conta"}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="font-semibold text-aquario-primary hover:text-aquario-primary/80 transition-colors"
            >
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
