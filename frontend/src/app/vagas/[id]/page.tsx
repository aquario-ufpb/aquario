"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useVagaById, useVagas } from "@/hooks";
import VacancyCard from "@/components/pages/vagas/vacancy-card";
import VagaProfileCard from "@/components/shared/vaga-profile-card";
import Link from "next/link";

export default function VagaPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  // Use React Query hooks
  const { data: vaga, isLoading, error: queryError } = useVagaById(params.id);
  const { data: allVagas = [] } = useVagas();

  // Compute similar vagas
  const otherVagas = useMemo(() => {
    if (!vaga) {
      return [];
    }
    return allVagas.filter(v => v.tipoVaga === vaga.tipoVaga && v.id !== vaga.id).slice(0, 8); // Limit to 8
  }, [vaga, allVagas]);

  if (isLoading) {
    return <Skeleton className="h-screen w-full" />;
  }

  if (queryError || !vaga) {
    const errorMessage = queryError instanceof Error ? queryError.message : "Vaga não encontrada.";
    return (
      <div className="container mx-auto p-4 pt-24 text-center text-red-500">{errorMessage}</div>
    );
  }

  return (
    <main className="mt-24">
      <div className="container mx-auto px-6 md:px-8 lg:px-16 pt-8 pb-4">
        {/* Back button */}
        <Button
          className="flex items-center gap-2 self-start rounded-full mb-6"
          onClick={() => router.back()}
        >
          Voltar
        </Button>
      </div>

      <div className="container mx-auto px-6 md:px-8 lg:px-16 pb-8">
        <div className="border border-border/50 rounded-2xl p-8 md:p-12">
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px] gap-10">
            {/* The card slot appears on the right on large screens and at the top on small screens. */}
            <div className="order-1 lg:order-2">
              <VagaProfileCard vaga={vaga} />
            </div>

            {/* Information about the vacancy */}
            <div className="order-2 lg:order-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-6">{vaga.titulo}</h1>

              {(vaga.prazo || vaga.salario) && (
                <div className="flex flex-col md:flex-row gap-6 text-sm text-muted-foreground mb-8">
                  {vaga.prazo && (
                    <div>
                      <p className="font-semibold mb-1">Prazo</p>
                      <p>{vaga.prazo}</p>
                    </div>
                  )}

                  {vaga.salario && (
                    <div>
                      <p className="font-semibold mb-1">Salário</p>
                      <p>{vaga.salario}</p>
                    </div>
                  )}
                </div>
              )}

              {vaga.sobreEmpresa && (
                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-3">Sobre a empresa</h2>
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {vaga.sobreEmpresa}
                  </p>
                </section>
              )}

              {vaga.descricao && (
                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-3">Descrição da vaga</h2>
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {vaga.descricao}
                  </p>
                </section>
              )}

              {vaga.responsabilidades?.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-3">Responsabilidades</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    {vaga.responsabilidades.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </section>
              )}

              {vaga.requisitos?.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-3">Requisitos</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    {vaga.requisitos.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </section>
              )}

              {vaga.informacoesAdicionais && (
                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-3">Informações adicionais</h2>
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {vaga.informacoesAdicionais}
                  </p>
                </section>
              )}

              {vaga.etapasProcesso?.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-xl font-semibold mb-3">Etapas do processo</h2>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                    {vaga.etapasProcesso.map((etapa, idx) => (
                      <li key={idx}>{etapa}</li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Divider only if there are other vacancies */}
      {otherVagas.length > 0 && (
        <div className="container mx-auto px-6 md:px-8 lg:px-16 my-12">
          <div className="w-full h-[1px] bg-border opacity-50"></div>
        </div>
      )}

      {otherVagas.length > 0 && (
        <div className="container mx-auto px-6 md:px-8 lg:px-16 pb-12">
          <h2 className="text-2xl md:text-3xl font-semibold mb-8">
            Outras vagas de {vaga.tipoVaga.toLowerCase()}
          </h2>

          {/* Related vacancies grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {otherVagas.map(v => (
              <Link key={v.id} href={`/vagas/${v.id}`}>
                <VacancyCard vaga={v} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
