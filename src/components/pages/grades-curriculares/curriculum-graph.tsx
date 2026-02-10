"use client";

import { useState, useRef, useCallback, useLayoutEffect, useMemo } from "react";
import type { GradeDisciplinaNode } from "@/lib/shared/types";
import { DisciplineNode } from "./discipline-node";
import { GraphEdges } from "./graph-edges";
import { DisciplineDetailDialog } from "./discipline-detail-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type CurriculumGraphProps = {
  disciplinas: GradeDisciplinaNode[];
  cursoNome: string;
  curriculoCodigo: string;
};

export function CurriculumGraph({ disciplinas, cursoNome, curriculoCodigo }: CurriculumGraphProps) {
  const [showOptativas, setShowOptativas] = useState(true);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [clickedCode, setClickedCode] = useState<string | null>(null);
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
    const activeCode = hoveredCode || clickedCode;
    if (!activeCode) {
      return null;
    }

    const codeToDisc = new Map<string, GradeDisciplinaNode>();
    for (const d of visibleDisciplinas) {
      codeToDisc.set(d.codigo, d);
    }

    // If activeCode is not in visible disciplines, return null
    if (!codeToDisc.has(activeCode)) {
      return null;
    }

    const codes = new Set<string>();
    codes.add(activeCode);

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

    walkUp(activeCode);
    walkDown(activeCode);
    return codes;
  }, [hoveredCode, clickedCode, visibleDisciplinas]);

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

  const handleNodeClick = useCallback(
    (disc: GradeDisciplinaNode, e: React.MouseEvent) => {
      e.stopPropagation();
      if (clickedCode === disc.codigo) {
        setSelectedDisc(disc);
        setDialogOpen(true);
      } else {
        setClickedCode(disc.codigo);
      }
    },
    [clickedCode]
  );

  const handleContainerClick = useCallback(() => {
    setClickedCode(null);
  }, []);

  const hasOptativas = disciplinas.some(d => d.natureza !== "OBRIGATORIA");

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#0e3a6c] dark:text-[#C8E6FA]">{cursoNome}</h2>
          <p className="text-sm text-muted-foreground">Currículo: {curriculoCodigo}</p>
        </div>
        <div className="flex items-center gap-6">
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
          <div className="flex items-center gap-3 text-xs">
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
          </div>
        </div>
      </div>

      {/* Graph container — fixed height, scrollable both axes */}
      <div
        className="overflow-auto rounded-lg border border-slate-200 dark:border-white/10"
        style={{ maxHeight: "70vh" }}
        onScroll={measureNodes}
      >
        <div
          ref={containerRef}
          className="relative flex gap-6 min-w-max p-2"
          onClick={handleContainerClick}
        >
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
                  isClicked={clickedCode === disc.codigo}
                  onClick={e => handleNodeClick(disc, e)}
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
