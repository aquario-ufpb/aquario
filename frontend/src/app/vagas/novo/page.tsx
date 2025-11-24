"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TipoVaga } from "@/components/pages/vagas/vacancy-card";

export default function NovaVagaPage() {
  const { token, user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipoVaga, setTipoVaga] = useState<TipoVaga | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPostJob = !!(
    user &&
    (user.papel === "DOCENTE" ||
      user.permissoes.includes("ADMIN") ||
      user.papelPlataforma === "MASTER_ADMIN")
  );

  useEffect(() => {
    if (!isAuthLoading && !canPostJob) {
      router.push("/vagas");
    }
  }, [isAuthLoading, canPostJob, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !descricao.trim() || !tipoVaga) {
      setError("Todos os campos são obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3001/vagas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ titulo, descricao, tipoVaga, centroId: user?.centro.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao criar a vaga");
      }

      router.push("/vagas");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || !canPostJob) {
    return <Skeleton className="h-screen w-full" />;
  }

  return (
    <main className="container mx-auto max-w-2xl p-4 pt-24">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h1 className="text-4xl font-bold">Divulgar Nova Vaga</h1>
        <div className="space-y-2">
          <Label htmlFor="titulo" className="text-lg">
            Título da Vaga
          </Label>
          <Input
            id="titulo"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Ex: Desenvolvedor Frontend Jr."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipoVaga" className="text-lg">
            Tipo de Vaga
          </Label>
          <Select onValueChange={(value: TipoVaga) => setTipoVaga(value)} value={tipoVaga}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TipoVaga).map(tipo => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="descricao" className="text-lg">
            Descrição
          </Label>
          <Textarea
            id="descricao"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Descreva os requisitos, responsabilidades e benefícios da vaga."
            rows={8}
          />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Publicando..." : "Publicar Vaga"}
        </Button>
      </form>
    </main>
  );
}
