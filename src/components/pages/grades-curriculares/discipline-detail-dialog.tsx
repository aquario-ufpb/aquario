import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import type { GradeDisciplinaNode } from "@/lib/shared/types";

type DisciplineDetailDialogProps = {
  discipline: GradeDisciplinaNode | null;
  allDisciplines: GradeDisciplinaNode[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const NATUREZA_LABELS: Record<string, string> = {
  OBRIGATORIA: "Obrigatória",
  OPTATIVA: "Optativa",
  COMPLEMENTAR_FLEXIVA: "Complementar Flexiva",
};

const NATUREZA_BADGE_VARIANTS: Record<string, string> = {
  OBRIGATORIA: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  OPTATIVA: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  COMPLEMENTAR_FLEXIVA: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};

export function DisciplineDetailDialog({
  discipline,
  allDisciplines,
  open,
  onOpenChange,
}: DisciplineDetailDialogProps) {
  const [history, setHistory] = useState<GradeDisciplinaNode[]>([]);
  const [current, setCurrent] = useState<GradeDisciplinaNode | null>(null);

  // Reset when the dialog opens with a new root discipline
  useEffect(() => {
    if (open && discipline) {
      setCurrent(discipline);
      setHistory([]);
    }
  }, [open, discipline]);

  const navigateTo = useCallback(
    (code: string) => {
      const target = allDisciplines.find(d => d.codigo === code);
      if (target && current) {
        setHistory(prev => [...prev, current]);
        setCurrent(target);
      }
    },
    [allDisciplines, current]
  );

  const goBack = useCallback(() => {
    setHistory(prev => {
      const next = [...prev];
      const last = next.pop();
      if (last) {
        setCurrent(last);
      }
      return next;
    });
  }, []);

  if (!current) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          {history.length > 0 && (
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2 w-fit"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Voltar para {history[history.length - 1].codigo}
            </button>
          )}
          <DialogTitle className="flex items-start gap-2 flex-wrap">
            <span className="font-mono text-sm opacity-70">{current.codigo}</span>
            <span>{current.nome}</span>
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge
                className={
                  NATUREZA_BADGE_VARIANTS[current.natureza] ?? NATUREZA_BADGE_VARIANTS.OBRIGATORIA
                }
              >
                {NATUREZA_LABELS[current.natureza] ?? current.natureza}
              </Badge>
              <Badge variant="outline">{current.periodo}° período</Badge>
              {current.cargaHorariaTotal !== null && (
                <Badge variant="outline">{current.cargaHorariaTotal}h total</Badge>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Carga horária breakdown */}
          {(current.cargaHorariaTeoria !== null || current.cargaHorariaPratica !== null) && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Carga Horária</h4>
              <div className="text-sm text-muted-foreground flex gap-4">
                {current.cargaHorariaTeoria !== null && (
                  <span>Teoria: {current.cargaHorariaTeoria}h</span>
                )}
                {current.cargaHorariaPratica !== null && (
                  <span>Prática: {current.cargaHorariaPratica}h</span>
                )}
              </div>
            </div>
          )}

          {/* Departamento */}
          {current.departamento && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Departamento</h4>
              <p className="text-sm text-muted-foreground">{current.departamento}</p>
            </div>
          )}

          {/* Modalidade */}
          {current.modalidade && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Modalidade</h4>
              <p className="text-sm text-muted-foreground">{current.modalidade}</p>
            </div>
          )}

          {/* Ementa */}
          {current.ementa && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Ementa</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{current.ementa}</p>
            </div>
          )}

          {/* Pré-requisitos */}
          {current.preRequisitos.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Pré-requisitos</h4>
              <div className="flex flex-wrap gap-1">
                {current.preRequisitos.map(code => {
                  const exists = allDisciplines.some(d => d.codigo === code);
                  return (
                    <Badge
                      key={code}
                      variant="secondary"
                      className={`font-mono text-xs ${exists ? "cursor-pointer hover:bg-accent" : ""}`}
                      onClick={exists ? () => navigateTo(code) : undefined}
                    >
                      {code}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Equivalências */}
          {current.equivalencias.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-1">Equivalências</h4>
              <div className="flex flex-wrap gap-1">
                {current.equivalencias.map(code => {
                  const exists = allDisciplines.some(d => d.codigo === code);
                  return (
                    <Badge
                      key={code}
                      variant="secondary"
                      className={`font-mono text-xs ${exists ? "cursor-pointer hover:bg-accent" : ""}`}
                      onClick={exists ? () => navigateTo(code) : undefined}
                    >
                      {code}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
