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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Save,
  CheckCircle2,
  ListChecks,
  Lock,
  Check,
  X,
  XCircle,
  BookOpen,
  ChevronDown,
  CircleDot,
} from "lucide-react";

type CurriculumGraphProps = {
  disciplinas: GradeDisciplinaNode[];
  cursoNome: string;
  curriculoCodigo: string;
  completedDisciplinaIds?: Set<string>;
  cursandoDisciplinaIds?: Set<string>;
  selectionMode?: boolean;
  onSelectionModeChange?: (enabled: boolean) => void;
  onSaveWithStatus?: (
    disciplinaIds: string[],
    status: "concluida" | "cursando" | "none"
  ) => void | Promise<void>;
  onMarcarDisciplina?: (disciplinaId: string, status: "concluida" | "cursando" | "none") => void;
  isSaving?: boolean;
  isLoggedIn?: boolean;
  activeSemestreNome?: string;
};

export function CurriculumGraph({
  disciplinas,
  cursoNome,
  curriculoCodigo,
  completedDisciplinaIds,
  cursandoDisciplinaIds,
  selectionMode,
  onSelectionModeChange,
  onSaveWithStatus,
  onMarcarDisciplina,
  isSaving,
  isLoggedIn,
  activeSemestreNome,
}: CurriculumGraphProps) {
  const [showOptativas, setShowOptativas] = useState(true);
  const [clickedCode, setClickedCode] = useState<string | null>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [selectedDisc, setSelectedDisc] = useState<GradeDisciplinaNode | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nodeRects, setNodeRects] = useState<Map<string, DOMRect>>(new Map());
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  // Selection set for bulk mode (keyed on disciplinaId)
  const [selectionSet, setSelectionSet] = useState<Set<string>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefsMap = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Clear selection set when exiting selection mode
  const handleSelectionModeChange = useCallback(
    (enabled: boolean) => {
      if (!enabled) {
        setSelectionSet(new Set());
      }
      onSelectionModeChange?.(enabled);
    },
    [onSelectionModeChange]
  );

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

  // Compute highlighted codes on click
  const highlightedCodes = useMemo(() => {
    if (!clickedCode) {
      return null;
    }

    const codeToDisc = new Map<string, GradeDisciplinaNode>();
    for (const d of visibleDisciplinas) {
      codeToDisc.set(d.codigo, d);
    }

    if (!codeToDisc.has(clickedCode)) {
      return null;
    }

    const codes = new Set<string>();
    codes.add(clickedCode);

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

    const walkDown = (code: string) => {
      for (const d of visibleDisciplinas) {
        if (d.preRequisitos.includes(code) && !codes.has(d.codigo)) {
          codes.add(d.codigo);
          walkDown(d.codigo);
        }
      }
    };

    walkUp(clickedCode);
    walkDown(clickedCode);
    return codes;
  }, [clickedCode, visibleDisciplinas]);

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

  useLayoutEffect(() => {
    const handler = () => measureNodes();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [measureNodes]);

  // Clear clickedCode when it's no longer visible
  useLayoutEffect(() => {
    if (clickedCode && !visibleDisciplinas.some(d => d.codigo === clickedCode)) {
      setClickedCode(null);
    }
  }, [clickedCode, visibleDisciplinas]);

  const setNodeRef = useCallback((code: string, el: HTMLButtonElement | null) => {
    if (el) {
      nodeRefsMap.current.set(code, el);
    } else {
      nodeRefsMap.current.delete(code);
    }
  }, []);

  // Unified click-based interaction (same for desktop and mobile)
  const handleNodeClick = useCallback(
    (disc: GradeDisciplinaNode, e: React.MouseEvent) => {
      e.stopPropagation();
      if (clickedCode === disc.codigo) {
        // Second click: open dialog
        setSelectedDisc(disc);
        setDialogOpen(true);
      } else {
        // First click: highlight dependency chain
        setClickedCode(disc.codigo);
      }
    },
    [clickedCode]
  );

  const handleToggleSelect = useCallback((disciplinaId: string) => {
    setSelectionSet(prev => {
      const next = new Set(prev);
      if (next.has(disciplinaId)) {
        next.delete(disciplinaId);
      } else {
        next.add(disciplinaId);
      }
      return next;
    });
  }, []);

  const handleContainerClick = useCallback(() => {
    setClickedCode(null);
  }, []);

  const handleSaveAs = useCallback(
    async (status: "concluida" | "cursando" | "none") => {
      if (selectionSet.size === 0) {
        return;
      }
      await onSaveWithStatus?.(Array.from(selectionSet), status);
      setSelectionSet(new Set());
    },
    [selectionSet, onSaveWithStatus]
  );

  // Check if any selected disciplines already have a status (for "Desmarcar" option)
  const hasMarkedInSelection = useMemo(() => {
    if (selectionSet.size === 0) {
      return false;
    }
    for (const id of selectionSet) {
      if (completedDisciplinaIds?.has(id) || cursandoDisciplinaIds?.has(id)) {
        return true;
      }
    }
    return false;
  }, [selectionSet, completedDisciplinaIds, cursandoDisciplinaIds]);

  // Compute locked disciplines (prereqs not all completed)
  const lockedCodes = useMemo(() => {
    if (!completedDisciplinaIds) {
      return new Set<string>();
    }
    const completedCodes = new Set<string>();
    for (const d of disciplinas) {
      if (completedDisciplinaIds.has(d.disciplinaId)) {
        completedCodes.add(d.codigo);
      }
    }
    const locked = new Set<string>();
    for (const d of disciplinas) {
      if (completedDisciplinaIds.has(d.disciplinaId)) {
        continue;
      }
      if (d.preRequisitos.length === 0) {
        continue;
      }
      if (!d.preRequisitos.every(req => completedCodes.has(req))) {
        locked.add(d.codigo);
      }
    }
    return locked;
  }, [disciplinas, completedDisciplinaIds]);

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

  // Determine dialog discipline status
  const dialogIsCompleted = selectedDisc
    ? !!completedDisciplinaIds?.has(selectedDisc.disciplinaId)
    : false;
  const dialogIsCursando = selectedDisc
    ? !!cursandoDisciplinaIds?.has(selectedDisc.disciplinaId)
    : false;

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
              onClick={() => handleSelectionModeChange(!selectionMode)}
              className="gap-2"
            >
              {selectionMode ? (
                <>
                  <X className="w-4 h-4" /> Sair do modo seleção
                </>
              ) : (
                <>
                  <ListChecks className="w-4 h-4" /> Selecionar cadeiras
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
            <span className="flex items-center gap-1.5">
              <span className="w-0.5 h-3 rounded-full bg-blue-400 dark:bg-blue-500" />
              Obrigatória
            </span>
            {showOptativas && (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-0.5 h-3 rounded-full bg-amber-400 dark:bg-amber-500" />
                  Optativa
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-0.5 h-3 rounded-full bg-teal-400 dark:bg-teal-500" />
                  Complementar
                </span>
              </>
            )}
            {isLoggedIn && (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-0.5 h-3 rounded-full bg-green-500 dark:bg-green-400" />
                  Concluída
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-0.5 h-3 rounded-full bg-purple-500 dark:bg-purple-400" />
                  Cursando
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  Trancada
                </span>
              </>
            )}
            {selectionMode && (
              <span className="flex items-center gap-1">
                <CircleDot className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                Selecionada
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar + Selection action */}
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
            {onSaveWithStatus && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    disabled={isSaving || selectionSet.size === 0}
                    className="gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? "Salvando..." : "Salvar"}
                    {selectionSet.size > 0 && ` (${selectionSet.size})`}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => void handleSaveAs("concluida")}>
                    <Check className="w-3.5 h-3.5 mr-2 text-green-600" />
                    Marcar como Concluídas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleSaveAs("cursando")}>
                    <BookOpen className="w-3.5 h-3.5 mr-2 text-purple-600" />
                    Marcar como Cursando
                    {activeSemestreNome ? ` (${activeSemestreNome})` : ""}
                  </DropdownMenuItem>
                  {hasMarkedInSelection && (
                    <DropdownMenuItem onClick={() => void handleSaveAs("none")}>
                      <XCircle className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                      Desmarcar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
        <div
          ref={containerRef}
          className="relative flex gap-8 min-w-max p-3"
          onClick={handleContainerClick}
        >
          {/* SVG edge overlay */}
          <GraphEdges
            disciplines={visibleDisciplinas}
            nodeRefs={nodeRects}
            containerRect={containerRect}
            highlightedCodes={highlightedCodes}
            hoveredCode={hoveredCode}
          />

          {/* Period columns */}
          {periods.map(([periodo, discs]) => (
            <div key={periodo} className="relative z-[1] flex flex-col gap-4 w-[105px]">
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
                  isClicked={clickedCode === disc.codigo}
                  isCompleted={!!completedDisciplinaIds?.has(disc.disciplinaId)}
                  isCursando={!!cursandoDisciplinaIds?.has(disc.disciplinaId)}
                  isLocked={lockedCodes.has(disc.codigo)}
                  selectionMode={selectionMode}
                  isSelected={selectionSet.has(disc.disciplinaId)}
                  onClick={e => handleNodeClick(disc, e)}
                  onMouseEnter={() => setHoveredCode(disc.codigo)}
                  onMouseLeave={() => setHoveredCode(null)}
                  onToggleComplete={() => handleToggleSelect(disc.disciplinaId)}
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
        isOwnCourse={isLoggedIn}
        isCompleted={dialogIsCompleted}
        isCursando={dialogIsCursando}
        isMarking={isSaving}
        activeSemestreNome={activeSemestreNome}
        onMarcar={onMarcarDisciplina}
      />
    </div>
  );
}
