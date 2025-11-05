"use client";

import Checkbox from "@/components/pages/vagas/checkbox-filter";
import VacancyCard, { Vaga } from "@/components/pages/vagas/vacancy-card";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchBar1 } from "@/components/ui/searchbar1";

import Banner from "@/components/shared/banner";

export default function VagasPage() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const canPostJob = !!(
    user &&
    (user.papel === "DOCENTE" ||
      user.permissoes.includes("ADMIN") ||
      user.papelPlataforma === "MASTER_ADMIN")
  );

  useEffect(() => {
    const fetchVagas = async () => {
      try {
        const response = await fetch("http://localhost:3001/vagas");
        if (!response.ok) {
          throw new Error("Falha ao buscar vagas");
        }
        const data = await response.json();
        setVagas(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVagas();
  }, []);

  const data = [
    {
      titulo: "Entidades",
      elementos: ["Laboratórios", "Grupos e Ligas", "UFPB", "Externo"],
    },
    {
      titulo: "Áreas",
      elementos: [
        "FrontEnd",
        "BackEnd",
        "Dados",
        "Infraestrutura",
        "Design",
        "Pesquisa",
        "Robótica",
        "Otimização e Algoritmos",
      ],
    },
    {
      titulo: "None",
      elementos: ["Remunerado", "Voluntário"],
    },
  ];

  return (
    <main className="px-[10%]">
      <div className="space-y-6 flex flex-col">
        <div className="pt-4">
          <Banner
            title="Explore vagas de emprego, estágio e de projetos voluntários no CI e afora"
            description="Nosso mural de vagas permite que qualquer pessoa ou laboratório busque alunos interessados em vagas em projetos ou estágios."
            buttonText="Divulgar uma vaga"
            buttonHref="/vagas/novo"
            showButton={canPostJob}
          />
        </div>
      </div>

      <div className="flex p-5 px-0 gap-6">
        <div className="hidden flex-col md:flex w-full md:w-3/4">
          <div className="mb-6 w-full">
            <SearchBar1 type="search" placeholder="Pesquisar" />
          </div>

          <div className="space-y-4 w-full">
            {isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))
              : vagas.map(vaga => (
                  <Link href={`/vagas/${vaga.id}`} key={vaga.id}>
                    <VacancyCard vaga={vaga} />
                  </Link>
                ))}
          </div>
        </div>

        <div className="hidden md:flex w-full md:w-1/4">
          <Checkbox data={data} />
        </div>

        <div className="flex flex-col md:hidden w-full">
          <div className="mb-6 w-full">
            <SearchBar1 type="search" placeholder="Pesquisar" />
          </div>

          <div className="mb-6 w-full">
            <Checkbox data={data} />
          </div>

          <div className="space-y-4 w-full">
            {isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))
              : vagas.map(vaga => (
                  <Link href={`/vagas/${vaga.id}`} key={vaga.id}>
                    <VacancyCard vaga={vaga} />
                  </Link>
                ))}
          </div>
        </div>
      </div>
    </main>
  );
}
