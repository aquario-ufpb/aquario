"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { CurriculumGraph } from "@/components/pages/grades-curriculares/curriculum-graph";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { useGradeCurricular } from "@/lib/client/hooks/use-grade-curricular";
import { useDisciplinasConcluidas } from "@/lib/client/hooks/use-disciplinas-concluidas";
import {
  useMarcarDisciplinas,
  useDisciplinasSemestreAtivo,
} from "@/lib/client/hooks/use-disciplinas-semestre";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { BookOpen, ArrowRight } from "lucide-react";

type CursandoStepProps = {
  onComplete: () => Promise<void>;
  isMutating: boolean;
  semestreNome?: string;
};

export function CursandoStep({ onComplete, isMutating, semestreNome }: CursandoStepProps) {
  const { data: user } = useCurrentUser();
  const { data: grade, isLoading: gradeLoading } = useGradeCurricular(user?.curso?.id ?? null);
  const { data: concluidasData } = useDisciplinasConcluidas();
  const { data: semestreData } = useDisciplinasSemestreAtivo();
  const marcarMutation = useMarcarDisciplinas();
  const selectionMode = true;
  const [page, setPage] = useState<1 | 2>(1);

  const cursandoIds = useMemo(() => {
    if (!semestreData?.disciplinas) {
      return new Set<string>();
    }
    return new Set(semestreData.disciplinas.map(d => d.disciplinaId));
  }, [semestreData]);

  const completedIds = useMemo(() => {
    if (!concluidasData?.disciplinaIds) {
      return new Set<string>();
    }
    return new Set(concluidasData.disciplinaIds);
  }, [concluidasData]);

  const handleSaveWithStatus = useCallback(
    async (disciplinaIds: string[], status: "concluida" | "cursando" | "none") => {
      if (disciplinaIds.length === 0) {
        return;
      }
      try {
        await marcarMutation.mutateAsync({ disciplinaIds, status });
        toast.success(`${disciplinaIds.length} disciplina(s) marcada(s) como cursando!`);
        await onComplete();
      } catch {
        toast.error("Erro ao salvar. Tente novamente.");
      }
    },
    [marcarMutation, onComplete]
  );

  if (page === 1) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-aquario-primary/10 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-aquario-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Disciplinas do Semestre</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Agora você vai selecionar as cadeiras que está cursando nesse período
            {semestreNome ? ` de ${semestreNome}` : ""}.
          </p>
        </div>

        <Button onClick={() => setPage(2)} size="lg" className="gap-2">
          Continuar
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  if (gradeLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Disciplinas do Semestre</h2>
          <p className="text-sm text-muted-foreground">Carregando grade curricular...</p>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 min-w-[120px]">
              <Skeleton className="h-6 w-full" />
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-16 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!grade) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Disciplinas do Semestre</h2>
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar a grade curricular.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onComplete} variant="outline" disabled={isMutating}>
            Continuar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Disciplinas do Semestre</h2>
        <p className="text-sm text-muted-foreground">
          Selecione as disciplinas que você <strong>está cursando</strong>
          {semestreNome ? ` em ${semestreNome}` : ""}. As disciplinas concluídas já aparecem em
          verde.
        </p>
      </div>

      <div className="overflow-x-auto -mx-6 px-6">
        <CurriculumGraph
          disciplinas={grade.disciplinas}
          cursoNome={grade.cursoNome}
          curriculoCodigo={grade.curriculoCodigo}
          completedDisciplinaIds={completedIds}
          cursandoDisciplinaIds={cursandoIds}
          selectionMode={selectionMode}
          onSaveWithStatus={handleSaveWithStatus}
          isSaving={marcarMutation.isPending}
          isLoggedIn={true}
          activeSemestreNome={semestreNome}
          allowedSaveStatuses={["cursando"]}
        />
      </div>
    </div>
  );
}
