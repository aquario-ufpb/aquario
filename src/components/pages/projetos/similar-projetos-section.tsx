"use client";

import Link from "next/link";
import ProjectCard from "@/components/shared/project-card";
import { Skeleton } from "@/components/ui/skeleton";
import { mapProjetoToCard } from "@/lib/client/mappers/projeto-mapper";
import { useSimilarProjetos } from "@/lib/client/hooks/use-projetos";

type SimilarProjetosSectionProps = {
  slug: string;
};

const LIMIT = 4;

export function SimilarProjetosSection({ slug }: SimilarProjetosSectionProps) {
  const { data, isLoading } = useSimilarProjetos(slug, LIMIT);

  if (isLoading) {
    return (
      <section className="mt-16">
        <h2 className="text-2xl font-display font-bold mb-6">Projetos similares</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: LIMIT }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-display font-bold mb-6">Projetos similares</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
        {data.map(p => {
          const card = mapProjetoToCard(p);
          return (
            <Link key={card.id} href={`/projetos/${card.id}`} className="h-full">
              <ProjectCard projeto={card} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
