"use client";

import { useOwnSigaaAcademicState } from "@/lib/client/hooks/use-sigaa";
import { curriculumStatus } from "@/lib/shared/sigaa/curriculum-status";
import { normalizeCurriculumCode } from "@/lib/shared/sigaa/curriculum-code";
import { useAuth } from "@/contexts/auth-context";
import { trackEvent } from "@/analytics/posthog-client";
import { CurriculumGraph } from "@/components/pages/grades-curriculares/curriculum-graph";
import { CursoSelector } from "@/components/pages/grades-curriculares/curso-selector";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAllCursos } from "@/lib/client/hooks/use-admin-cursos";
import { useSemestreAtivo } from "@/lib/client/hooks/use-calendario-academico";
import { useDisciplinasConcluidas } from "@/lib/client/hooks/use-disciplinas-concluidas";
import {
  useDisciplinasSemestreAtivo,
  useMarcarDisciplinas,
} from "@/lib/client/hooks/use-disciplinas-semestre";
import { useGradeCurricular } from "@/lib/client/hooks/use-grade-curricular";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { PAGE_HEADER_TEXT } from "@/lib/shared/constants/page-header-text";
import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function GradesCurricularesPage() {
  const [selectedCursoId, setSelectedCursoId] = useState<string | null>(null);
  const [autoSelected, setAutoSelected] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);

  const { data: cursos = [], isLoading: cursosLoading } = useAllCursos();
  const { isLoading: authLoading, token } = useAuth();
  const { data: user, isPending: userPending } = useCurrentUser();
  const {
    data: grade,
    isLoading: gradeLoading,
    isError: gradeError,
    refetch: retryGrade,
  } = useGradeCurricular(selectedCursoId);
  const { data: concluidasData } = useDisciplinasConcluidas();
  const { data: semestreData } = useDisciplinasSemestreAtivo();
  const { data: semestreAtivo } = useSemestreAtivo();
  const marcarMutation = useMarcarDisciplinas();

  const isLoggedIn = !!user;
  const isOwnCourse = isLoggedIn && selectedCursoId === user?.curso?.id;
  const sigaa = useOwnSigaaAcademicState(isOwnCourse);
  const imported = sigaa.data?.snapshot;

  // Auto-select: user's course if logged in, otherwise first available
  useEffect(() => {
    if (
      authLoading ||
      (token && userPending) ||
      autoSelected ||
      selectedCursoId ||
      cursos.length === 0
    ) {
      return;
    }

    const userCursoId = user?.curso?.id;
    if (userCursoId && cursos.some(c => c.id === userCursoId)) {
      setSelectedCursoId(userCursoId);
    } else {
      setSelectedCursoId(cursos[0].id);
    }
    setAutoSelected(true);
  }, [cursos, user, autoSelected, selectedCursoId, authLoading, token, userPending]);

  const handleSelectionModeChange = useCallback((enabled: boolean) => {
    setSelectionMode(enabled);
  }, []);

  const academicStatus = useMemo(() => {
    if (!isOwnCourse || !grade) {
      return null;
    }
    return curriculumStatus(
      grade.disciplinas,
      concluidasData?.disciplinaIds ?? [],
      semestreData?.disciplinas?.map(item => item.disciplinaId) ?? [],
      imported?.payload.curriculum.components ?? []
    );
  }, [isOwnCourse, grade, concluidasData, semestreData, imported]);
  const completedIds = academicStatus?.completedIds;
  const cursandoIds = academicStatus?.enrolledIds;
  const curriculumMismatch =
    isOwnCourse &&
    imported &&
    grade &&
    normalizeCurriculumCode(imported.payload.curriculum.code) !==
      normalizeCurriculumCode(grade.curriculoCodigo);

  // Handler for marking disciplines (bulk or single)
  const handleMarcarDisciplinas = useCallback(
    async (disciplinaIds: string[], status: "concluida" | "cursando" | "none") => {
      try {
        await marcarMutation.mutateAsync({ disciplinaIds, status });
        const n = disciplinaIds.length;
        const messages: Record<string, string> = {
          concluida:
            n === 1
              ? "Marcada como concluída!"
              : `${n} disciplina(s) marcada(s) como concluída(s)!`,
          cursando:
            n === 1 ? "Marcada como cursando!" : `${n} disciplina(s) marcada(s) como cursando!`,
          none: n === 1 ? "Status removido." : `${n} disciplina(s) desmarcada(s).`,
        };
        toast.success(messages[status]);
      } catch {
        toast.error("Erro ao salvar. Tente novamente.");
      }
    },
    [marcarMutation]
  );

  // Count cursando disciplines without turma for nudge banner
  const cursandoWithoutTurma = useMemo(() => {
    if (!isOwnCourse || !semestreData?.disciplinas) {
      return 0;
    }
    return semestreData.disciplinas.filter(d => d.turma === null).length;
  }, [isOwnCourse, semestreData]);

  return (
    <div className="mx-auto max-w-[1600px] px-3 pb-10 pt-6 sm:px-6 md:px-8 mt-20">
      <PageHeader
        title={PAGE_HEADER_TEXT.gradesCurriculares.title}
        subtitle={PAGE_HEADER_TEXT.gradesCurriculares.subtitle}
      />

      <CursoSelector
        cursos={cursos}
        selectedCursoId={selectedCursoId}
        onSelect={id => {
          setSelectedCursoId(id);
          setSelectionMode(false);
          const nome = cursos.find(c => c.id === id)?.nome;
          if (nome) {
            trackEvent("grade_curricular_curso_selected", { curso_nome: nome });
          }
        }}
        isLoading={cursosLoading}
      />

      {isOwnCourse && sigaa.isLoading && (
        <p role="status" className="mb-4 text-sm text-muted-foreground">
          Carregando status acadêmicos do SIGAA…
        </p>
      )}
      {isOwnCourse && sigaa.isError && (
        <p role="alert" className="mb-4 rounded-lg border p-3 text-sm">
          Não foi possível carregar os status SIGAA; somente marcações manuais estão disponíveis.{" "}
          <button className="underline" onClick={() => void sigaa.refetch()}>
            Tentar novamente
          </button>
        </p>
      )}
      {isOwnCourse && imported && (
        <div className="mb-4 space-y-2 rounded-lg border bg-card p-3 text-xs text-muted-foreground">
          <p>
            Status SIGAA têm prioridade sobre marcações manuais, como em Dados acadêmicos.{" "}
            <Link href="/me/academico" className="underline">
              Ver conexão e dados importados
            </Link>
          </p>
          {curriculumMismatch && (
            <p>
              A importação usa o currículo {imported.payload.curriculum.code}; esta grade é do
              currículo {grade?.curriculoCodigo}. Os status são associados apenas por código exato
              da disciplina.
            </p>
          )}
          {!!academicStatus?.missing.length && (
            <details>
              <summary className="cursor-pointer">
                {academicStatus.missing.length}{" "}
                {academicStatus.missing.length === 1
                  ? "disciplina concluída ou cursando não consta nesta grade"
                  : "disciplinas concluídas ou cursando não constam nesta grade"}
              </summary>
              <ul className="mt-2 space-y-1">
                {academicStatus.missing.map(item => (
                  <li key={item.code}>
                    {item.name} · {item.code}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Nudge banner: cursando disciplines without turma */}
      {cursandoWithoutTurma > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-purple-800 dark:text-purple-200">
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            <span>
              Você tem {cursandoWithoutTurma} disciplina{cursandoWithoutTurma !== 1 ? "s" : ""}{" "}
              cursando sem turma definida.
            </span>
          </div>
          <Link
            href="/calendario"
            className="flex items-center gap-1 text-sm font-medium text-purple-700 dark:text-purple-300 hover:underline whitespace-nowrap"
          >
            Definir turmas
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Loading state */}
      {gradeLoading && selectedCursoId && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 min-w-[150px]">
              <Skeleton className="h-8 w-full" />
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-20 w-full" />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* No data state */}
      {gradeError && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm"
        >
          <p>Não foi possível atualizar a grade curricular. Tente novamente.</p>
          <Button variant="outline" size="sm" onClick={() => void retryGrade()}>
            Tentar novamente
          </Button>
        </div>
      )}
      {selectedCursoId && !gradeLoading && !gradeError && !grade && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">Nenhuma grade curricular encontrada para este curso</p>
        </div>
      )}

      {/* Graph */}
      {grade && (
        <CurriculumGraph
          key={grade.curriculoId}
          browsable
          disciplinas={grade.disciplinas}
          cursoNome={grade.cursoNome}
          curriculoCodigo={grade.curriculoCodigo}
          completedDisciplinaIds={completedIds}
          cursandoDisciplinaIds={cursandoIds}
          selectionMode={isOwnCourse ? selectionMode : false}
          onSelectionModeChange={handleSelectionModeChange}
          onSaveWithStatus={handleMarcarDisciplinas}
          onMarcarDisciplina={(id, status) => handleMarcarDisciplinas([id], status)}
          isSaving={marcarMutation.isPending}
          isLoggedIn={isOwnCourse}
          activeSemestreNome={semestreAtivo?.nome}
        />
      )}
    </div>
  );
}
