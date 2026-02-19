import { forwardRef } from "react";
import { Eye, Lock, CircleDot } from "lucide-react";
import type { GradeDisciplinaNode, NaturezaDisciplinaType } from "@/lib/shared/types";

const NATUREZA_ACCENT: Record<NaturezaDisciplinaType, string> = {
  OBRIGATORIA: "border-l-blue-400 dark:border-l-blue-500",
  OPTATIVA: "border-l-amber-400 dark:border-l-amber-500",
  COMPLEMENTAR_FLEXIVA: "border-l-teal-400 dark:border-l-teal-500",
};

type DisciplineNodeProps = {
  discipline: GradeDisciplinaNode;
  isHighlighted: boolean;
  isFaded: boolean;
  isClicked: boolean;
  isCompleted?: boolean;
  isCursando?: boolean;
  isLocked?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onToggleComplete?: () => void;
};

export const DisciplineNode = forwardRef<HTMLButtonElement, DisciplineNodeProps>(
  function DisciplineNode(
    {
      discipline,
      isHighlighted,
      isFaded,
      isClicked,
      isCompleted,
      isCursando,
      isLocked,
      selectionMode,
      isSelected,
      onClick,
      onMouseEnter,
      onMouseLeave,
      onToggleComplete,
    },
    ref
  ) {
    const accent = NATUREZA_ACCENT[discipline.natureza] ?? NATUREZA_ACCENT.OBRIGATORIA;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (selectionMode && onToggleComplete) {
        onToggleComplete();
      } else {
        onClick?.(e);
      }
    };

    // Left accent color: status overrides natureza
    let leftAccent: string;
    if (isCompleted) {
      leftAccent = "border-l-green-500 dark:border-l-green-400";
    } else if (isCursando) {
      leftAccent = "border-l-purple-500 dark:border-l-purple-400";
    } else {
      leftAccent = accent;
    }

    const isLockedOnly = isLocked && !isCompleted && !isCursando;

    return (
      <button
        ref={ref}
        onClick={handleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`
          relative h-[84px] rounded-md border border-border border-l-[3px] p-2 overflow-hidden
          flex items-center justify-center text-center
          transition-all duration-200 cursor-pointer
          bg-card text-card-foreground
          ${leftAccent}
          ${isLockedOnly ? "opacity-40" : ""}
          ${selectionMode && isSelected ? "ring-2 ring-blue-500 dark:ring-blue-400 shadow-sm" : ""}
          ${isHighlighted && !selectionMode ? "ring-2 ring-blue-500/60 dark:ring-blue-400/60 shadow-sm z-10" : ""}
          ${isFaded && !selectionMode ? "opacity-20" : ""}
          ${!isHighlighted && !isFaded && !isLockedOnly ? "hover:shadow-md" : ""}
        `}
      >
        {/* Selection indicator */}
        {selectionMode && isSelected && (
          <div className="absolute top-1 right-1">
            <CircleDot className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
        )}
        {/* Lock indicator for locked disciplines */}
        {!(selectionMode && isSelected) && isLocked && !isCompleted && !isCursando && (
          <div className="absolute top-1 right-1">
            <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          </div>
        )}
        <span className="text-[10px] font-medium leading-tight line-clamp-3">
          {discipline.nome}
        </span>
        {/* "Ver mais" prompt on click */}
        {isClicked && !selectionMode && (
          <div className="absolute bottom-0.5 inset-x-0 flex items-center justify-center gap-0.5 text-[8px] font-semibold text-muted-foreground animate-in fade-in duration-200">
            <Eye className="w-2 h-2" />
            <span>Ver mais</span>
          </div>
        )}
      </button>
    );
  }
);
