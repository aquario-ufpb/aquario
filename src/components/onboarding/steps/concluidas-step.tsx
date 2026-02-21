"use client";

import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { CurriculumGraph } from "@/components/pages/grades-curriculares/curriculum-graph";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { useGradeCurricular } from "@/lib/client/hooks/use-grade-curricular";
import { useDisciplinasConcluidas } from "@/lib/client/hooks/use-disciplinas-concluidas";
import { useMarcarDisciplinas } from "@/lib/client/hooks/use-disciplinas-semestre";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type ConcluidasStepProps = {
  onComplete: () => Promise<void>;
  isMutating: boolean;
};

export function ConcluidasStep({ onComplete, isMutating }: ConcluidasStepProps) {
  const { data: user } = useCurrentUser();
  const { data: grade, isLoading: gradeLoading } = useGradeCurricular(user?.curso?.id ?? null);
  const { data: concluidasData } = useDisciplinasConcluidas();
  const marcarMutation = useMarcarDisciplinas();
  const selectionMode = true;

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
        toast.success(`${disciplinaIds.length} disciplina(s) marcada(s) como concluída(s)!`);
        await onComplete();
      } catch {
        toast.error("Erro ao salvar. Tente novamente.");
      }
    },
    [marcarMutation, onComplete]
  );

  if (gradeLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Disciplinas Concluídas</h2>
          <p className="text-sm text-muted-foreground">
            Selecione as disciplinas que você já concluiu na sua grade curricular.
          </p>
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
          <h2 className="text-xl font-bold">Disciplinas Concluídas</h2>
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar a grade curricular do seu curso.
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
        <h2 className="text-xl font-bold">Disciplinas Concluídas</h2>
        <p className="text-sm text-muted-foreground">
          Selecione na grade abaixo todas as disciplinas que você <strong>já concluiu</strong> e
          clique em &quot;Salvar como Concluídas&quot;.
        </p>
      </div>

      <div className="overflow-x-auto -mx-6 px-6">
        <CurriculumGraph
          disciplinas={grade.disciplinas}
          cursoNome={grade.cursoNome}
          curriculoCodigo={grade.curriculoCodigo}
          completedDisciplinaIds={completedIds}
          selectionMode={selectionMode}
          onSaveWithStatus={handleSaveWithStatus}
          isSaving={marcarMutation.isPending}
          isLoggedIn={true}
          allowedSaveStatuses={["concluida"]}
        />
      </div>
    </div>
  );
}
