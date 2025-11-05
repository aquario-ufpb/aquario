"use client";

import React, { useState, FormEvent, useEffect } from "react";
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

// Tipos para os dados do backend
type Centro = {
  id: string;
  nome: string;
  sigla: string;
};

type Curso = {
  id: string;
  nome: string;
};

export default function Registro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState<"DISCENTE" | "DOCENTE">("DISCENTE");
  const [centroId, setCentroId] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [periodo, setPeriodo] = useState("");

  const [centros, setCentros] = useState<Centro[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);

  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCentros = async () => {
      try {
        // TODO: Substituir pela rota real da API que lista os centros
        const response = await fetch("http://localhost:3001/centros");
        if (!response.ok) {
          throw new Error("Falha ao buscar centros");
        }
        const data = await response.json();
        setCentros(data);
      } catch (err) {
        console.error(err);
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
        // TODO: Substituir pela rota real da API que lista cursos de um centro
        const response = await fetch(`http://localhost:3001/centros/${centroId}/cursos`);
        if (!response.ok) {
          throw new Error("Falha ao buscar cursos");
        }
        const data = await response.json();
        setCursos(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCursos();
  }, [centroId]);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch("http://localhost:3001/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          senha,
          papel,
          centroId,
          cursoId: papel === "DISCENTE" ? cursoId : undefined,
          periodo: papel === "DISCENTE" ? parseInt(periodo) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha no registro");
      }

      router.push("/login");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-2">
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
              <h1 className="text-4xl font-bold text-aquario-primary dark:text-white">Crie sua conta</h1>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Preencha os campos para se registrar
              </p>
            </div>

            <div className="space-y-4 w-full max-w-xs">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Você é?</Label>
                <Select
                  onValueChange={(value: "DISCENTE" | "DOCENTE") => setPapel(value)}
                  defaultValue={papel}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISCENTE">Aluno(a)</SelectItem>
                    <SelectItem value="DOCENTE">Professor(a)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Centro</Label>
                <Select onValueChange={setCentroId} value={centroId}>
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
              {papel === "DISCENTE" && (
                <>
                  <div className="space-y-2">
                    <Label>Curso</Label>
                    <Select
                      onValueChange={setCursoId}
                      value={cursoId}
                      disabled={!centroId || cursos.length === 0}
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periodo">Período</Label>
                    <Input
                      id="periodo"
                      type="number"
                      min="1"
                      max="10"
                      value={periodo}
                      onChange={e => setPeriodo(e.target.value)}
                      placeholder="Ex: 1, 2, 3..."
                      required
                    />
                  </div>
                </>
              )}
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              <Button type="submit" className="w-full">
                Registrar
              </Button>
            </div>
            <p className="text-center text-sm">
              Já tem uma conta?{" "}
              <a href="/login" className="font-semibold text-sky-500 hover:underline">
                Faça login
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
