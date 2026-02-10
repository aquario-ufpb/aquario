"use client";

import { useState, useRef, useCallback, useLayoutEffect, useMemo } from "react";
import type { GradeDisciplinaNode } from "@/lib/shared/types";
import { DisciplineNode } from "./discipline-node";
import { GraphEdges } from "./graph-edges";
import { DisciplineDetailDialog } from "./discipline-detail-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Save, CheckCircle2, ListChecks, Lock, LockOpen, Check, X } from "lucide-react";

type CurriculumGraphProps = {
  disciplinas: GradeDisciplinaNode[];
  cursoNome: string;
  curriculoCodigo: string;
  completedDisciplinaIds?: Set<string>;
  selectionMode?: boolean;
  onSelectionModeChange?: (enabled: boolean) => void;
  onToggleDisciplina?: (disciplinaId: string) => void;
  onSave?: () => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  isLoggedIn?: boolean;
};

export function CurriculumGraph({
  disciplinas,
  cursoNome,
  curriculoCodigo,
  completedDisciplinaIds,
  selectionMode,
  onSelectionModeChange,
  onToggleDisciplina,
  onSave,
  isSaving,
  hasUnsavedChanges,
  isLoggedIn,
}: CurriculumGraphProps) {
  const [showOptativas, setShowOptativas] = useState(true);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [selectedDisc, setSelectedDisc] = useState<GradeDisciplinaNode | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nodeRects, setNodeRects] = useState<Map<string, DOMRect>>(new Map());
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefsMap = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Filter disciplines based on optativas toggle
  const visibleDisciplinas = useMemo(() => {
    if (showOptativas) {
      return disciplinas;
    }
    return disciplinas.filter(d => d.natureza === "OBRIGATORIA");
  }, [disciplinas, showOptativas]);

  // Group by period
  const periods = useMemo(() => {
    const map = new Map<number, GradeDisciplinaNode[]>();
    for (const d of visibleDisciplinas) {
      const list = map.get(d.periodo) ?? [];
      list.push(d);
      map.set(d.periodo, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [visibleDisciplinas]);

  // Compute highlighted codes on hover
  const highlightedCodes = useMemo(() => {
    if (!hoveredCode) {
      return null;
    }

    const codeToDisc = new Map<string, GradeDisciplinaNode>();
    for (const d of visibleDisciplinas) {
      codeToDisc.set(d.codigo, d);
    }

    const codes = new Set<string>();
    codes.add(hoveredCode);

    // Walk up prerequisites (what does this depend on?)
    const walkUp = (code: string) => {
      const disc = codeToDisc.get(code);
      if (!disc) {
        return;
      }
      for (const req of disc.preRequisitos) {
        if (!codes.has(req) && codeToDisc.has(req)) {
          codes.add(req);
          walkUp(req);
        }
      }
    };

    // Walk down dependents (what does this unlock?)
    const walkDown = (code: string) => {
      for (const d of visibleDisciplinas) {
        if (d.preRequisitos.includes(code) && !codes.has(d.codigo)) {
          codes.add(d.codigo);
          walkDown(d.codigo);
        }
      }
    };

    walkUp(hoveredCode);
    walkDown(hoveredCode);
    return codes;
  }, [hoveredCode, visibleDisciplinas]);

  // Measure node positions for SVG edges
  const measureNodes = useCallback(() => {
    if (!containerRef.current) {
      return;
    }
    const cRect = containerRef.current.getBoundingClientRect();
    setContainerRect(cRect);

    const rects = new Map<string, DOMRect>();
    nodeRefsMap.current.forEach((el, code) => {
      if (el) {
        rects.set(code, el.getBoundingClientRect());
      }
    });
    setNodeRects(rects);
  }, []);

  useLayoutEffect(() => {
    measureNodes();
  }, [visibleDisciplinas, measureNodes]);

  // Also re-measure on window resize and scroll (scroll changes getBoundingClientRect)
  useLayoutEffect(() => {
    const handler = () => measureNodes();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [measureNodes]);

  const setNodeRef = useCallback((code: string, el: HTMLButtonElement | null) => {
    if (el) {
      nodeRefsMap.current.set(code, el);
    } else {
      nodeRefsMap.current.delete(code);
    }
  }, []);

  const handleNodeClick = useCallback((disc: GradeDisciplinaNode) => {
    setSelectedDisc(disc);
    setDialogOpen(true);
  }, []);

  // Compute unlocked & locked disciplines
  const { unlockedCodes, lockedCodes } = useMemo(() => {
    if (!completedDisciplinaIds || !selectionMode) {
      return { unlockedCodes: new Set<string>(), lockedCodes: new Set<string>() };
    }
    const completedCodes = new Set<string>();
    for (const d of disciplinas) {
      if (completedDisciplinaIds.has(d.disciplinaId)) {
        completedCodes.add(d.codigo);
      }
    }
    const unlocked = new Set<string>();
    const locked = new Set<string>();
    for (const d of disciplinas) {
      if (completedDisciplinaIds.has(d.disciplinaId)) {
        continue;
      }
      if (d.preRequisitos.length === 0) {
        continue;
      }
      const allMet = d.preRequisitos.every(req => completedCodes.has(req));
      if (allMet) {
        unlocked.add(d.codigo);
      } else {
        locked.add(d.codigo);
      }
    }
    return { unlockedCodes: unlocked, lockedCodes: locked };
  }, [disciplinas, completedDisciplinaIds, selectionMode]);

  // Progress stats
  const progressStats = useMemo(() => {
    if (!completedDisciplinaIds) {
      return null;
    }
    const obrigatorias = visibleDisciplinas.filter(d => d.natureza === "OBRIGATORIA");
    const completedObrigatorias = obrigatorias.filter(d =>
      completedDisciplinaIds.has(d.disciplinaId)
    );
    const totalCompleted = visibleDisciplinas.filter(d =>
      completedDisciplinaIds.has(d.disciplinaId)
    ).length;
    const totalHorasCompleted = visibleDisciplinas
      .filter(d => completedDisciplinaIds.has(d.disciplinaId))
      .reduce((sum, d) => sum + (d.cargaHorariaTotal ?? 0), 0);
    const totalHoras = obrigatorias.reduce((sum, d) => sum + (d.cargaHorariaTotal ?? 0), 0);
    return {
      total: visibleDisciplinas.length,
      totalCompleted,
      obrigatorias: obrigatorias.length,
      completedObrigatorias: completedObrigatorias.length,
      percentObrigatorias:
        obrigatorias.length > 0
          ? Math.round((completedObrigatorias.length / obrigatorias.length) * 100)
          : 0,
      totalHorasCompleted,
      totalHoras,
    };
  }, [visibleDisciplinas, completedDisciplinaIds]);

  const hasOptativas = disciplinas.some(d => d.natureza !== "OBRIGATORIA");

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#0e3a6c] dark:text-[#C8E6FA]">{cursoNome}</h2>
          <p className="text-sm text-muted-foreground">Currículo: {curriculoCodigo}</p>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          {isLoggedIn && onSelectionModeChange && (
            <Button
              variant={selectionMode ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectionModeChange(!selectionMode)}
              className="gap-2"
            >
              {selectionMode ? (
                <>
                  <X className="w-4 h-4" /> Sair do modo seleção
                </>
              ) : (
                <>
                  <ListChecks className="w-4 h-4" /> Selecionar disciplinas que concluí
                </>
              )}
            </Button>
          )}
          {hasOptativas && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-optativas"
                checked={showOptativas}
                onCheckedChange={checked => setShowOptativas(checked === true)}
              />
              <Label htmlFor="show-optativas" className="text-sm cursor-pointer">
                Mostrar optativas
              </Label>
            </div>
          )}
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            {!selectionMode ? (
              <>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-blue-300 dark:bg-blue-700" />
                  Obrigatória
                </span>
                {showOptativas && (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-amber-300 dark:bg-amber-700" />
                      Optativa
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-700" />
                      Complementar
                    </span>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  Concluída
                </span>
                <span className="flex items-center gap-1">
                  <LockOpen className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                  Desbloqueada
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  Trancada
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar + Save */}
      {selectionMode && progressStats && (
        <div className="mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <strong>{progressStats.completedObrigatorias}</strong>/{progressStats.obrigatorias}{" "}
                obrigatórias ({progressStats.percentObrigatorias}%)
              </span>
              <span className="text-muted-foreground">
                {progressStats.totalHorasCompleted}h / {progressStats.totalHoras}h
              </span>
              {progressStats.totalCompleted > progressStats.completedObrigatorias && (
                <span className="text-muted-foreground">
                  +{progressStats.totalCompleted - progressStats.completedObrigatorias} optativa(s)
                </span>
              )}
            </div>
            {onSave && (
              <Button
                size="sm"
                onClick={onSave}
                disabled={isSaving || !hasUnsavedChanges}
                className="gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? "Salvando..." : hasUnsavedChanges ? "Salvar progresso" : "Salvo"}
              </Button>
            )}
          </div>
          <Progress value={progressStats.percentObrigatorias} className="h-2" />
        </div>
      )}

      {/* Graph container — fixed height, scrollable both axes */}
      <div
        className="overflow-auto rounded-lg border border-slate-200 dark:border-white/10"
        style={{ maxHeight: "70vh" }}
        onScroll={measureNodes}
      >
        <div ref={containerRef} className="relative flex gap-6 min-w-max p-2">
          {/* SVG edge overlay */}
          <GraphEdges
            disciplines={visibleDisciplinas}
            nodeRefs={nodeRects}
            containerRect={containerRect}
            highlightedCodes={highlightedCodes}
          />

          {/* Period columns */}
          {periods.map(([periodo, discs]) => (
            <div
              key={periodo}
              className="relative z-[1] flex flex-col gap-3 min-w-[140px] max-w-[155px]"
            >
              <div className="text-center text-xs font-semibold text-muted-foreground py-2 bg-slate-100 dark:bg-slate-800/50 rounded-md">
                {periodo}° Período
              </div>
              {discs.map(disc => (
                <DisciplineNode
                  key={disc.id}
                  ref={el => setNodeRef(disc.codigo, el)}
                  discipline={disc}
                  isHighlighted={highlightedCodes !== null && highlightedCodes.has(disc.codigo)}
                  isFaded={highlightedCodes !== null && !highlightedCodes.has(disc.codigo)}
                  isCompleted={completedDisciplinaIds?.has(disc.disciplinaId)}
                  isUnlocked={selectionMode && unlockedCodes.has(disc.codigo)}
                  isLocked={selectionMode && lockedCodes.has(disc.codigo)}
                  selectionMode={selectionMode}
                  onClick={() => handleNodeClick(disc)}
                  onToggleComplete={() => onToggleDisciplina?.(disc.disciplinaId)}
                  onMouseEnter={() => setHoveredCode(disc.codigo)}
                  onMouseLeave={() => setHoveredCode(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Detail dialog */}
      <DisciplineDetailDialog
        discipline={selectedDisc}
        allDisciplines={disciplinas}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
