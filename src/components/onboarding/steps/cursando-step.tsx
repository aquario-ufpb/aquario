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
import { useSigaaOnboardingSuggestions } from "@/lib/client/hooks/use-sigaa-onboarding-suggestions";

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
  const {
    suggestions,
    hasSnapshot,
    isLoading: suggestionsLoading,
  } = useSigaaOnboardingSuggestions(
    grade,
    semestreNome ?? null,
    user?.permissoes.includes("sigaa:beta") ?? false
  );
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
        await marcarMutation.mutateAsync({
          disciplinaIds,
          status,
          expectedCursoId: user?.curso.id,
          expectedCurriculoId: grade?.curriculoId,
        });
        toast.success(
          disciplinaIds.length === 1
            ? "1 disciplina marcada como cursando!"
            : `${disciplinaIds.length} disciplinas marcadas como cursando!`
        );
        await onComplete();
      } catch {
        toast.error("Erro ao salvar. Tente novamente.");
      }
    },
    [grade?.curriculoId, marcarMutation, onComplete, user?.curso.id]
  );

  if (page === 1 && !hasSnapshot && !gradeLoading && !suggestionsLoading) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-aquario-primary/10 flex items-center justify-center">
            <BookOpen aria-hidden="true" className="w-8 h-8 text-aquario-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-pretty text-2xl font-bold">Disciplinas do Semestre</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Agora você vai selecionar as cadeiras que está cursando nesse período
            {semestreNome ? ` de ${semestreNome}` : ""}.
          </p>
        </div>

        <Button onClick={() => setPage(2)} size="lg" className="min-h-11 gap-2">
          Continuar
          <ArrowRight aria-hidden="true" className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  if (gradeLoading || suggestionsLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-pretty text-xl font-bold">Disciplinas do Semestre</h2>
          <p className="text-sm text-muted-foreground">Carregando grade curricular…</p>
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
          <h2 className="text-pretty text-xl font-bold">Disciplinas do Semestre</h2>
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar a grade curricular.
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
    suggestions?.enrollmentSemester === "matched" &&
    suggestions.enrolled.suggestedDisciplineIds.length === 0 &&
    suggestions.enrolled.alreadySavedDisciplineIds.length > 0;
  const curriculumGraph = (
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
      mobileLayout="list"
      initialSelectedDisciplinaIds={suggestions?.enrolled.suggestedDisciplineIds}
    />
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-pretty text-xl font-bold">Disciplinas do Semestre</h2>
        <p className="text-sm text-muted-foreground">
          {suggestions?.enrolled.suggestedDisciplineIds.length ? (
            <>
              As sugestões seguras do SIGAA já estão marcadas. Revise e ajuste se necessário antes
              de salvar. As disciplinas concluídas aparecem em verde.
            </>
          ) : (
            <>
              Selecione as disciplinas que você <strong>está cursando</strong>
              {semestreNome ? ` em ${semestreNome}` : ""}. As disciplinas concluídas já aparecem em
              verde.
            </>
          )}
        </p>
      </div>

      {hasSnapshot && suggestions && (
        <div className="rounded-lg border border-aquario-primary/20 bg-aquario-primary/5 p-3 text-sm">
          {suggestions.enrollmentSemester === "matched" ? (
            <>
              <p className="font-medium">
                Sugestões deste semestre: {suggestions.enrolled.suggestedDisciplineIds.length}.
              </p>
              {(suggestions.enrolled.alreadySavedDisciplineIds.length > 0 ||
                suggestions.enrolled.conflicts.length > 0 ||
                suggestions.enrolled.unmatchedCodes.length > 0) && (
                <p className="mt-1 text-muted-foreground">
                  {suggestions.enrolled.alreadySavedDisciplineIds.length > 0 &&
                    `${suggestions.enrolled.alreadySavedDisciplineIds.length} já estavam salvas. `}
                  {suggestions.enrolled.conflicts.length +
                    suggestions.enrolled.unmatchedCodes.length >
                    0 &&
                    `${suggestions.enrolled.conflicts.length + suggestions.enrolled.unmatchedCodes.length} ficaram fora da seleção por divergência ou falta de correspondência na grade.`}
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">
              As disciplinas importadas não foram pré-selecionadas porque o semestre do SIGAA não
              corresponde ao semestre ativo no Aquário. Você ainda pode selecionar manualmente.
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
