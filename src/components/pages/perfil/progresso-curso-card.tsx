"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, BookOpen } from "lucide-react";
import { useGradeCurricular } from "@/lib/client/hooks/use-grade-curricular";
import { useDisciplinasConcluidas } from "@/lib/client/hooks/use-disciplinas-concluidas";
import { Skeleton } from "@/components/ui/skeleton";

type ProgressoCursoCardProps = {
  cursoId: string;
  cursoNome: string;
  isOwnProfile: boolean;
};

export function ProgressoCursoCard({ cursoId, cursoNome, isOwnProfile }: ProgressoCursoCardProps) {
  const { data: grade, isLoading: gradeLoading } = useGradeCurricular(cursoId);
  const { data: concluidasData, isLoading: concluidasLoading } = useDisciplinasConcluidas();

  const stats = useMemo(() => {
    if (!grade || !concluidasData) {
      return null;
    }

    const completedSet = new Set(concluidasData.disciplinaIds);
    const obrigatorias = grade.disciplinas.filter(d => d.natureza === "OBRIGATORIA");
    const completedObrigatorias = obrigatorias.filter(d => completedSet.has(d.disciplinaId));
    const totalCompleted = grade.disciplinas.filter(d => completedSet.has(d.disciplinaId)).length;
    const totalHorasCompleted = grade.disciplinas
      .filter(d => completedSet.has(d.disciplinaId))
      .reduce((sum, d) => sum + (d.cargaHorariaTotal ?? 0), 0);
    const totalHoras = obrigatorias.reduce((sum, d) => sum + (d.cargaHorariaTotal ?? 0), 0);
    const percent =
      obrigatorias.length > 0
        ? Math.round((completedObrigatorias.length / obrigatorias.length) * 100)
        : 0;

    return {
      completedObrigatorias: completedObrigatorias.length,
      obrigatorias: obrigatorias.length,
      totalCompleted,
      percent,
      totalHorasCompleted,
      totalHoras,
    };
  }, [grade, concluidasData]);

  // Only show for own profile when there's data
  if (!isOwnProfile) {
    return null;
  }

  const isLoading = gradeLoading || concluidasLoading;

  if (isLoading) {
    return (
      <div className="rounded-lg border p-4">
        <Skeleton className="h-5 w-40 mb-3" />
        <Skeleton className="h-2 w-full mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>
    );
  }

  if (!stats || stats.totalCompleted === 0) {
    return null;
  }

  return (
    <Link
      href="/grades-curriculares"
      className="block rounded-lg border border-slate-200 dark:border-white/10 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
    >
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-[#0e3a6c] dark:text-[#C8E6FA]" />
        <h3 className="text-sm font-semibold text-[#0e3a6c] dark:text-[#C8E6FA]">
          Progresso em {cursoNome}
        </h3>
      </div>
      <Progress value={stats.percent} className="h-2 mb-2" />
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
          {stats.completedObrigatorias}/{stats.obrigatorias} obrigatórias ({stats.percent}%)
        </span>
        <span>
          {stats.totalHorasCompleted}h / {stats.totalHoras}h
        </span>
      </div>
    </Link>
  );
}
