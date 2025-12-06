"use client";

import React, { useState, FormEvent, useEffect } from "react";
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
import Image from "next/image";
import { authService } from "@/lib/api/auth";
import { centrosService } from "@/lib/api/centros";
import { cursosService } from "@/lib/api/cursos";
import type { Centro } from "@/lib/types/centro.types";
import type { Curso } from "@/lib/types/curso.types";

export default function Registro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [centroId, setCentroId] = useState("");
  const [cursoId, setCursoId] = useState("");

  const [centros, setCentros] = useState<Centro[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCentros, setIsLoadingCentros] = useState(true);
  const [isLoadingCursos, setIsLoadingCursos] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchCentros = async () => {
      try {
        setIsLoadingCentros(true);
        const data = await centrosService.getAll();
        setCentros(data);
      } catch (err) {
        console.error("Falha ao buscar centros:", err);
        setError("Falha ao carregar centros. Tente novamente.");
      } finally {
        setIsLoadingCentros(false);
      }
    };
    fetchCentros();
  }, []);

  useEffect(() => {
    if (!centroId) {
      setCursos([]);
      setCursoId("");
      return;
    }
    const fetchCursos = async () => {
      try {
        setIsLoadingCursos(true);
        const data = await cursosService.getByCentro(centroId);
        setCursos(data);
      } catch (err) {
        console.error("Falha ao buscar cursos:", err);
        setError("Falha ao carregar cursos. Tente novamente.");
      } finally {
        setIsLoadingCursos(false);
      }
    };
    fetchCursos();
  }, [centroId]);

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
    <div className="flex items-center justify-center min-h-screen p-2 mt-20">
      <div className="grid w-full max-w-7xl h-auto gap-0 lg:grid-cols-2 border border-gray-200 dark:border-gray-700 dark:bg-transparent rounded-lg overflow-hidden my-12">
        <div className="relative hidden lg:flex items-center justify-center bg-sky-300 dark:bg-sky-800">
          <Image
            src="/logo_removebg.png"
            alt="Logo"
            width={96}
            height={96}
            className="absolute top-6 left-6 object-contain"
          />
        </div>

        <div className="flex items-center justify-center p-6 md:p-8 bg-white dark:bg-transparent">
          <form
            onSubmit={handleRegister}
            className="w-full max-w-md space-y-6 flex flex-col items-center"
          >
            <div className="text-center">
              <h1 className="text-4xl font-bold text-aquario-primary dark:text-white">
                Crie sua conta
              </h1>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Preencha os campos para se registrar
              </p>
            </div>

            <div className="space-y-4 w-full max-w-xs">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@academico.ufpb.br"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Apenas emails @academico.ufpb.br são permitidos
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres</p>
              </div>
              <div className="space-y-2">
                <Label>Centro</Label>
                <Select
                  onValueChange={setCentroId}
                  value={centroId}
                  disabled={isLoadingCentros || isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu centro" />
                  </SelectTrigger>
                  <SelectContent>
                    {centros.map(centro => (
                      <SelectItem key={centro.id} value={centro.id}>
                        {centro.sigla} - {centro.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Curso</Label>
                <Select
                  onValueChange={setCursoId}
                  value={cursoId}
                  disabled={!centroId || isLoadingCursos || cursos.length === 0 || isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {cursos.map(curso => (
                      <SelectItem key={curso.id} value={curso.id}>
                        {curso.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!centroId && (
                  <p className="text-xs text-muted-foreground">Selecione um centro primeiro</p>
                )}
              </div>
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400 text-center">
                    {success}
                  </p>
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !centroId || !cursoId}
              >
                {isLoading ? "Registrando..." : "Registrar"}
              </Button>
            </div>
            <p className="text-center text-sm">
              Já tem uma conta?{" "}
              <Link href="/login" className="font-semibold text-sky-500 hover:underline">
                Faça login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
