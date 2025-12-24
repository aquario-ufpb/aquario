"use client";

import React, { useState, FormEvent, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authService } from "@/lib/client/api/auth";
import { useCentros, useCursos } from "@/lib/client/hooks";
import { useBackend } from "@/lib/shared/config/env";

export default function Registro() {
  const { isEnabled: backendEnabled } = useBackend();
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [centroId, setCentroId] = useState("");
  const [cursoId, setCursoId] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use React Query hooks
  const { data: centros = [], isLoading: isLoadingCentros, error: centrosError } = useCentros();
  const { data: cursos = [], isLoading: isLoadingCursos, error: cursosError } = useCursos(centroId);

  // Redirect to home if backend is disabled
  useEffect(() => {
    if (!backendEnabled) {
      router.replace("/");
    }
  }, [backendEnabled, router]);

  // Handle errors from React Query
  useEffect(() => {
    if (centrosError) {
      setError("Falha ao carregar centros. Tente novamente.");
    }
  }, [centrosError]);

  useEffect(() => {
    if (cursosError) {
      setError("Falha ao carregar cursos. Tente novamente.");
    }
  }, [cursosError]);

  // Reset cursoId when centroId changes
  useEffect(() => {
    if (!centroId) {
      setCursoId("");
    }
  }, [centroId]);

  if (!backendEnabled) {
    return null;
  }

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const result = await authService.register({
        nome,
        email,
        senha,
        centroId,
        cursoId,
      });

      if (result.verificado) {
        // Auto-verified (EMAIL_MOCK_MODE=true)
        setSuccess(result.message);
        setTimeout(() => {
          router.push("/login?registered=true");
        }, 2000);
      } else {
        // Needs email verification
        setSuccess(result.message);
        setTimeout(() => {
          router.push("/login?verify=true");
        }, 3000);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 mt-20">
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
            Crie sua conta
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Preencha os campos para se registrar</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="nome"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Nome Completo
                </Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Seu nome completo"
                />
              </div>

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
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Apenas emails @academico.ufpb.br são permitidos
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={8}
                  className="h-12 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Mínimo de 8 caracteres"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Mínimo de 8 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Centro
                </Label>
                <Select
                  onValueChange={setCentroId}
                  value={centroId}
                  disabled={isLoadingCentros || isLoading}
                >
                  <SelectTrigger className="h-12 border-gray-200 dark:border-gray-600">
                    <SelectValue placeholder="Selecione seu centro" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingCentros ? (
                      <SelectItem value="loading" disabled>
                        Carregando centros...
                      </SelectItem>
                    ) : (
                      centros.map(centro => (
                        <SelectItem key={centro.id} value={centro.id}>
                          {centro.sigla} - {centro.nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Curso
                </Label>
                <Select
                  onValueChange={setCursoId}
                  value={cursoId}
                  disabled={!centroId || isLoadingCursos || cursos.length === 0 || isLoading}
                >
                  <SelectTrigger className="h-12 border-gray-200 dark:border-gray-600">
                    <SelectValue placeholder="Selecione seu curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingCursos ? (
                      <SelectItem value="loading" disabled>
                        Carregando cursos...
                      </SelectItem>
                    ) : cursos.length === 0 && centroId ? (
                      <SelectItem value="no-courses" disabled>
                        Nenhum curso encontrado
                      </SelectItem>
                    ) : (
                      cursos.map(curso => (
                        <SelectItem key={curso.id} value={curso.id}>
                          {curso.nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {!centroId && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Selecione um centro primeiro
                  </p>
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
              disabled={isLoading || !centroId || !cursoId}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Registrando..." : "Criar conta"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Já tem uma conta?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Faça login
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
