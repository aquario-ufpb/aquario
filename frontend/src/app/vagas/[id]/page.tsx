"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import VagaProfileCard from "@/components/shared/vaga-profile-card";
import { Vaga } from "@/components/pages/vagas/vacancy-card";
import { Button } from "@/components/ui/button";

export default function VagaPage({ params }: { params: { id: string } }) {
  const [vaga, setVaga] = useState<Vaga | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      const fetchVaga = async () => {
        try {
          const response = await fetch(`http://localhost:3001/vagas/${params.id}`);
          if (!response.ok) {
            throw new Error("Vaga não encontrada");
          }
          const data = await response.json();
          setVaga(data);
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
      fetchVaga();
    }
  }, [params.id]);

  if (isLoading) {
    return <Skeleton className="h-screen w-full" />;
  }

  if (error || !vaga) {
    return (
      <div className="container mx-auto p-4 pt-24 text-center text-red-500">
        {error || "Vaga não encontrada."}
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <Button className="self-start mb-6 rounded-full" onClick={() => router.back()}>
        Voltar
      </Button>

      <div className="flex flex-col md:flex-row md:w-4/5 items-start justify-between gap-12">
        <div className="flex-1">
          <p className="text-muted-foreground text-sm mb-2">Detalhes da Vaga</p>
          <h1 className="text-4xl font-bold mb-4">{vaga.titulo}</h1>
          <p className="text-lg text-muted-foreground whitespace-pre-line leading-relaxed">
            {vaga.descricao}
          </p>
        </div>

        <div className="flex-shrink-0">
          <VagaProfileCard
            vaga={{
              ...vaga,
              publicador: {
                ...vaga.publicador,
                urlFotoPerfil: vaga.publicador.urlFotoPerfil || "",
              },
            }}
          />
        </div>
      </div>
    </main>
  );
}
