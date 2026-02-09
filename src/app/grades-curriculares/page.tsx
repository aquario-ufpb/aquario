"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAllCursos } from "@/lib/client/hooks/use-admin-cursos";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { useGradeCurricular } from "@/lib/client/hooks/use-grade-curricular";
import {
  useDisciplinasConcluidas,
  useUpdateDisciplinasConcluidas,
} from "@/lib/client/hooks/use-disciplinas-concluidas";
import { GradeCurricularHeader } from "@/components/pages/grades-curriculares/grade-curricular-header";
import { CursoSelector } from "@/components/pages/grades-curriculares/curso-selector";
import { CurriculumGraph } from "@/components/pages/grades-curriculares/curriculum-graph";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function GradesCurricularesPage() {
  const [selectedCursoId, setSelectedCursoId] = useState<string | null>(null);
  const [autoSelected, setAutoSelected] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [localCompleted, setLocalCompleted] = useState<Set<string>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: cursos = [], isLoading: cursosLoading } = useAllCursos();
  const { data: user } = useCurrentUser();
  const { data: grade, isLoading: gradeLoading } = useGradeCurricular(selectedCursoId);
  const { data: concluidasData } = useDisciplinasConcluidas();
  const updateMutation = useUpdateDisciplinasConcluidas();

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

  // Sync server data to local state
  useEffect(() => {
    if (concluidasData) {
      setLocalCompleted(new Set(concluidasData.disciplinaIds));
      setHasUnsavedChanges(false);
    }
  }, [concluidasData]);

  const handleToggleDisciplina = useCallback((disciplinaId: string) => {
    setLocalCompleted(prev => {
      const next = new Set(prev);
      if (next.has(disciplinaId)) {
        next.delete(disciplinaId);
      } else {
        next.add(disciplinaId);
      }
      return next;
    });
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await updateMutation.mutateAsync(Array.from(localCompleted));
      setHasUnsavedChanges(false);
      toast.success("Progresso salvo com sucesso!");
    } catch {
      toast.error("Erro ao salvar progresso. Tente novamente.");
    }
  }, [localCompleted, updateMutation]);

  const handleSelectionModeChange = useCallback((enabled: boolean) => {
    setSelectionMode(enabled);
  }, []);

  // Show completed state only when viewing own course and logged in
  const completedIds = useMemo(() => {
    if (!isOwnCourse) return undefined;
    return localCompleted;
  }, [isOwnCourse, localCompleted]);

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl mt-20">
      <GradeCurricularHeader />

      <CursoSelector
        cursos={cursos}
        selectedCursoId={selectedCursoId}
        onSelect={setSelectedCursoId}
        isLoading={cursosLoading}
      />

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
          selectionMode={isOwnCourse ? selectionMode : false}
          onSelectionModeChange={handleSelectionModeChange}
          onToggleDisciplina={handleToggleDisciplina}
          onSave={handleSave}
          isSaving={updateMutation.isPending}
          hasUnsavedChanges={hasUnsavedChanges}
          isLoggedIn={isOwnCourse}
        />
      )}
    </div>
  );
}
