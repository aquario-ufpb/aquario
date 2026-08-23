"use client";

import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { CurriculumGraph } from "@/components/pages/grades-curriculares/curriculum-graph";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { useGradeCurricular } from "@/lib/client/hooks/use-grade-curricular";
import { useDisciplinasConcluidas } from "@/lib/client/hooks/use-disciplinas-concluidas";
import { useMarcarDisciplinas } from "@/lib/client/hooks/use-disciplinas-semestre";
import { useSigaaOnboardingSuggestions } from "@/lib/client/hooks/use-sigaa-onboarding-suggestions";
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
  const {
    suggestions,
    hasSnapshot,
    isLoading: suggestionsLoading,
  } = useSigaaOnboardingSuggestions(grade, null, user?.permissoes.includes("sigaa:beta") ?? false);
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
        await marcarMutation.mutateAsync({
          disciplinaIds,
          status,
          expectedCursoId: user?.curso.id,
          expectedCurriculoId: grade?.curriculoId,
        });
        toast.success(
          disciplinaIds.length === 1
            ? "1 disciplina marcada como concluída!"
            : `${disciplinaIds.length} disciplinas marcadas como concluídas!`
        );
        await onComplete();
      } catch {
        toast.error("Erro ao salvar. Tente novamente.");
      }
    },
    [grade?.curriculoId, marcarMutation, onComplete, user?.curso.id]
  );

  if (gradeLoading || suggestionsLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-pretty text-xl font-bold">Disciplinas Concluídas</h2>
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
          <h2 className="text-pretty text-xl font-bold">Disciplinas Concluídas</h2>
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar a grade curricular do seu curso.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onComplete} variant="outline" className="min-h-11" disabled={isMutating}>
            Continuar
          </Button>
        </div>
      </div>
    );
  }

  const everythingAlreadyConfirmed =
    Boolean(suggestions) &&
    suggestions?.completed.suggestedDisciplineIds.length === 0 &&
    suggestions.completed.alreadySavedDisciplineIds.length > 0;
  const curriculumGraph = (
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
      mobileLayout="list"
      initialSelectedDisciplinaIds={suggestions?.completed.suggestedDisciplineIds}
    />
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-pretty text-xl font-bold">Disciplinas Concluídas</h2>
        <p className="text-sm text-muted-foreground">
          {suggestions?.completed.suggestedDisciplineIds.length ? (
            <>
              As sugestões seguras do SIGAA já estão marcadas. Revise, ajuste se necessário e clique
              em &quot;Salvar como Concluídas&quot;.
            </>
          ) : (
            <>
              Selecione na grade abaixo todas as disciplinas que você <strong>já concluiu</strong> e
              clique em &quot;Salvar como Concluídas&quot;.
            </>
          )}
        </p>
      </div>

      {hasSnapshot && suggestions && (
        <div className="rounded-lg border border-aquario-primary/20 bg-aquario-primary/5 p-3 text-sm">
          <p className="font-medium">
            Sugestões encontradas: {suggestions.completed.suggestedDisciplineIds.length}.
          </p>
          {(suggestions.completed.alreadySavedDisciplineIds.length > 0 ||
            suggestions.completed.conflicts.length > 0 ||
            suggestions.completed.unmatchedCodes.length > 0) && (
            <p className="mt-1 text-muted-foreground">
              {suggestions.completed.alreadySavedDisciplineIds.length > 0 &&
                `${suggestions.completed.alreadySavedDisciplineIds.length} já estavam salvas. `}
              {suggestions.completed.conflicts.length +
                suggestions.completed.unmatchedCodes.length >
                0 &&
                `${suggestions.completed.conflicts.length + suggestions.completed.unmatchedCodes.length} ficaram fora da seleção por divergência ou falta de correspondência na grade.`}
            </p>
          )}
        </div>
      )}

      {everythingAlreadyConfirmed ? (
        <details className="rounded-lg border bg-muted/20 text-sm">
          <summary className="min-h-11 cursor-pointer px-4 py-3 font-medium">Revisar grade</summary>
          <div className="min-w-0 border-t p-3">{curriculumGraph}</div>
        </details>
      ) : (
        <div className="min-w-0">{curriculumGraph}</div>
      )}

      {everythingAlreadyConfirmed && (
        <div className="flex justify-end">
          <Button onClick={onComplete} disabled={isMutating} className="min-h-11">
            Tudo certo, continuar
          </Button>
        </div>
      )}
    </div>
  );
}
