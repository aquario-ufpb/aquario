"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";

import ProjectCard from "@/components/shared/project-card";
import { listProjetos } from "@/lib/client/api/projetos";
import { mapProjetoToCard } from "@/lib/client/mappers/projeto-mapper";

const POOL_SIZE = 30;
const VISIBLE_COUNT = 10;

export function TopProjetosCarousel() {
  const { data: projetos } = useQuery({
    queryKey: ["projetos", "top-by-autores", { pool: POOL_SIZE }],
    queryFn: async () => {
      const data = await listProjetos({
        status: "PUBLICADO",
        orderBy: "autoresCount",
        order: "desc",
        limit: POOL_SIZE,
      });
      return data.projetos;
    },
    staleTime: 5 * 60 * 1000,
  });

  const cards = useMemo(() => {
    if (!projetos || projetos.length === 0) {
      return [];
    }
    const shuffled = [...projetos];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, VISIBLE_COUNT).map(mapProjetoToCard);
  }, [projetos]);

  if (cards.length === 0) {
    return null;
  }

  // Duplicate the list so the marquee can wrap seamlessly at translateX(-50%).
  const looped = [...cards, ...cards];

  return (
    <div className="mx-auto mb-24 max-w-6xl md:mb-32">
      <div className="mb-8 flex items-end justify-between gap-4 md:mb-10">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-sky-200">
            Em destaque
          </p>
          <h2 className="font-display text-3xl font-bold leading-tight text-white md:text-4xl">
            Projetos destaque
          </h2>
        </div>
        <Link
          href="/projetos"
          className="hidden shrink-0 items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-sky-100 transition-colors hover:bg-white/10 hover:text-white md:inline-flex"
        >
          Ver todos
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="group relative -mx-4 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-aquario-primary to-transparent md:w-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-aquario-primary to-transparent md:w-20" />

        <div
          className="flex w-fit gap-6 px-4 motion-safe:animate-group-marquee group-hover:[animation-play-state:paused]"
          aria-label="Carrossel de projetos em destaque"
        >
          {looped.map((projeto, index) => (
            <Link
              key={`${projeto.id}-${index}`}
              href={`/projetos/${projeto.id}`}
              aria-hidden={index >= cards.length}
              tabIndex={index >= cards.length ? -1 : undefined}
              className="block w-[260px] flex-shrink-0 sm:w-[300px] md:w-[340px] lg:w-[360px]"
            >
              <div className="rounded-2xl bg-white p-3 shadow-lg dark:bg-slate-900">
                <ProjectCard projeto={projeto} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 md:hidden">
        <Link
          href="/projetos"
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-100"
        >
          Ver todos os projetos
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
