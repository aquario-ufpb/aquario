import { forwardRef } from "react";
import { Check, Lock, LockOpen } from "lucide-react";
import type { GradeDisciplinaNode, NaturezaDisciplinaType } from "@/lib/shared/types";

const NATUREZA_COLORS: Record<
  NaturezaDisciplinaType,
  { bg: string; border: string; text: string }
> = {
  OBRIGATORIA: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-300 dark:border-blue-700",
    text: "text-blue-900 dark:text-blue-100",
  },
  OPTATIVA: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-300 dark:border-amber-700",
    text: "text-amber-900 dark:text-amber-100",
  },
  COMPLEMENTAR_FLEXIVA: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-300 dark:border-emerald-700",
    text: "text-emerald-900 dark:text-emerald-100",
  },
};

type DisciplineNodeProps = {
  discipline: GradeDisciplinaNode;
  isHighlighted: boolean;
  isFaded: boolean;
  isCompleted?: boolean;
  isUnlocked?: boolean;
  isLocked?: boolean;
  selectionMode?: boolean;
  onClick: () => void;
  onToggleComplete?: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

export const DisciplineNode = forwardRef<HTMLButtonElement, DisciplineNodeProps>(
  function DisciplineNode(
    {
      discipline,
      isHighlighted,
      isFaded,
      isCompleted,
      isUnlocked,
      isLocked,
      selectionMode,
      onClick,
      onToggleComplete,
      onMouseEnter,
      onMouseLeave,
    },
    ref
  ) {
    const colors = NATUREZA_COLORS[discipline.natureza] ?? NATUREZA_COLORS.OBRIGATORIA;
    const hasPreReqs = discipline.preRequisitos.length > 0;

    const handleClick = () => {
      if (selectionMode && onToggleComplete) {
        onToggleComplete();
      } else {
        onClick();
      }
    };

    // Determine background/border/text based on state
    let stateClasses: string;
    if (isCompleted) {
      stateClasses = "bg-green-50 dark:bg-green-950/40 border-green-400 dark:border-green-700 text-green-900 dark:text-green-100";
    } else if (isLocked) {
      stateClasses = "bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500";
    } else {
      stateClasses = `${colors.bg} ${colors.border} ${colors.text}`;
    }

    return (
      <button
        ref={ref}
        onClick={handleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`
          relative w-full text-left rounded-md border p-2 transition-all duration-200 cursor-pointer
          ${stateClasses}
          ${isHighlighted ? "ring-2 ring-blue-500 dark:ring-blue-400 shadow-md scale-[1.01] z-10" : ""}
          ${isFaded ? "opacity-30" : ""}
          ${!isHighlighted && !isFaded ? "hover:shadow-sm hover:scale-[1.005]" : ""}
        `}
      >
        {isCompleted && (
          <div className="absolute top-1 right-1">
            <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
          </div>
        )}
        {isUnlocked && !isCompleted && (
          <div className="absolute top-1 right-1">
            <LockOpen className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
          </div>
        )}
        {isLocked && (
          <div className="absolute top-1 right-1">
            <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          </div>
        )}
        <div className="text-[10px] font-mono font-semibold leading-tight mb-0.5 opacity-70">
          {discipline.codigo}
        </div>
        <div className="text-[11px] font-medium leading-tight line-clamp-2">{discipline.nome}</div>
        {discipline.cargaHorariaTotal !== null && (
          <div className="text-[9px] mt-0.5 opacity-60">{discipline.cargaHorariaTotal}h</div>
        )}
        {hasPreReqs && (
          <div className="text-[9px] mt-0.5 opacity-50">
            Req: {discipline.preRequisitos.join(", ")}
          </div>
        )}
      </button>
    );
  }
);
