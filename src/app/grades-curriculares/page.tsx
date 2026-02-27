"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAllCursos } from "@/lib/client/hooks/use-admin-cursos";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { useGradeCurricular } from "@/lib/client/hooks/use-grade-curricular";
import { useDisciplinasConcluidas } from "@/lib/client/hooks/use-disciplinas-concluidas";
import {
  useDisciplinasSemestreAtivo,
  useMarcarDisciplinas,
} from "@/lib/client/hooks/use-disciplinas-semestre";
import { useSemestreAtivo } from "@/lib/client/hooks/use-calendario-academico";
import { GradeCurricularHeader } from "@/components/pages/grades-curriculares/grade-curricular-header";
import { CursoSelector } from "@/components/pages/grades-curriculares/curso-selector";
import { CurriculumGraph } from "@/components/pages/grades-curriculares/curriculum-graph";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/analytics/posthog-client";

export default function GradesCurricularesPage() {
  const [selectedCursoId, setSelectedCursoId] = useState<string | null>(null);
  const [autoSelected, setAutoSelected] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);

  const { data: cursos = [], isLoading: cursosLoading } = useAllCursos();
  const { data: user } = useCurrentUser();
  const { data: grade, isLoading: gradeLoading } = useGradeCurricular(selectedCursoId);
  const { data: concluidasData } = useDisciplinasConcluidas();
  const { data: semestreData } = useDisciplinasSemestreAtivo();
  const { data: semestreAtivo } = useSemestreAtivo();
  const marcarMutation = useMarcarDisciplinas();

  const isLoggedIn = !!user;
  const isOwnCourse = isLoggedIn && selectedCursoId === user?.curso?.id;

  // Auto-select: user's course if logged in, otherwise first available
  useEffect(() => {
    if (autoSelected || selectedCursoId || cursos.length === 0) {
      return;
    }

    const userCursoId = user?.curso?.id;
    if (userCursoId && cursos.some(c => c.id === userCursoId)) {
      setSelectedCursoId(userCursoId);
    } else {
      setSelectedCursoId(cursos[0].id);
    }
    setAutoSelected(true);
  }, [cursos, user, autoSelected, selectedCursoId]);

  const handleSelectionModeChange = useCallback((enabled: boolean) => {
    setSelectionMode(enabled);
  }, []);

  // Completed IDs directly from server data
  const completedIds = useMemo(() => {
    if (!isOwnCourse || !concluidasData) {
      return undefined;
    }
    return new Set(concluidasData.disciplinaIds);
  }, [isOwnCourse, concluidasData]);

  // Cursando IDs from active semester
  const cursandoIds = useMemo(() => {
    if (!isOwnCourse || !semestreData?.disciplinas?.length) {
      return undefined;
    }
    return new Set(semestreData.disciplinas.map(d => d.disciplinaId));
  }, [isOwnCourse, semestreData]);

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
    <div className="container mx-auto p-4 md:p-8 max-w-7xl mt-20">
      <GradeCurricularHeader />

      <CursoSelector
        cursos={cursos}
        selectedCursoId={selectedCursoId}
        onSelect={id => {
          setSelectedCursoId(id);
          const nome = cursos.find(c => c.id === id)?.nome;
          if (nome) {
            trackEvent("grade_curricular_curso_selected", { curso_nome: nome });
          }
        }}
        isLoading={cursosLoading}
      />

      {/* Nudge banner: cursando disciplines without turma */}
      {cursandoWithoutTurma > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 flex items-center justify-between gap-4">
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
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 min-w-[150px]">
              <Skeleton className="h-8 w-full" />
              {Array.from({ length: 4 + Math.floor(Math.random() * 3) }).map((_, j) => (
                <Skeleton key={j} className="h-20 w-full" />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* No data state */}
      {selectedCursoId && !gradeLoading && !grade && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">Nenhuma grade curricular encontrada para este curso</p>
        </div>
      )}

      {/* Graph */}
      {grade && (
        <CurriculumGraph
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
