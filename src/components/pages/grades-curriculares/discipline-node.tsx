import { forwardRef } from "react";
import { Eye, Lock, CircleDot } from "lucide-react";
import type { GradeDisciplinaNode, NaturezaDisciplinaType } from "@/lib/shared/types";

const NATUREZA_ACCENT: Record<NaturezaDisciplinaType, string> = {
  OBRIGATORIA: "bg-blue-100/70 dark:bg-blue-900/30",
  OPTATIVA: "bg-amber-100/70 dark:bg-amber-900/30",
  COMPLEMENTAR_FLEXIVA: "bg-teal-100/70 dark:bg-teal-900/30",
};

type DisciplineNodeProps = {
  discipline: GradeDisciplinaNode;
  isHighlighted: boolean;
  isFaded: boolean;
  isClicked: boolean;
  isHovered?: boolean;
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
      isHovered,
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

    // Background accent color: status overrides natureza
    let bgAccent: string;
    if (isCompleted) {
      bgAccent = "bg-green-100/70 dark:bg-green-900/30";
    } else if (isCursando) {
      bgAccent = "bg-purple-100/70 dark:bg-purple-900/30";
    } else {
      bgAccent = accent;
    }

    const isLockedOnly =
      isLocked && !isCompleted && !isCursando && !(selectionMode && isSelected) && !isHighlighted;

    return (
      <button
        ref={ref}
        onClick={handleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`
          relative h-[84px] rounded-md border border-border p-2 overflow-hidden
          flex items-center justify-center text-center
          transition-all duration-200 cursor-pointer
          text-card-foreground bg-card
          ${isLockedOnly ? "opacity-40" : ""}
          ${selectionMode && isSelected ? "ring-2 ring-blue-500 dark:ring-blue-400 shadow-sm" : ""}
          ${isHighlighted && !selectionMode ? "ring-2 ring-blue-500/60 dark:ring-blue-400/60 shadow-sm z-10" : ""}
          ${isFaded && !selectionMode ? "opacity-20" : ""}
          ${!isHighlighted && !isFaded && !isLockedOnly ? "hover:shadow-md" : ""}
        `}
      >
        {/* Accent colour overlay — kept separate so the solid bg-card base blocks arrows behind the node */}
        <div className={`absolute inset-0 ${bgAccent}`} />
        {/* Selection indicator */}
        {selectionMode && isSelected && (
          <div className="absolute top-1 right-1">
            <CircleDot aria-hidden className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
        )}
        {/* Lock indicator for locked disciplines */}
        {!(selectionMode && isSelected) && isLockedOnly && (
          <div className="absolute top-1 right-1">
            <Lock aria-hidden className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          </div>
        )}
        <span className="text-[10px] font-medium leading-tight line-clamp-3">
          {discipline.nome}
        </span>
        {/* "Ver mais" prompt on click/hover */}
        {(isClicked || isHovered) && !selectionMode && (
          <div className="absolute bottom-0.5 inset-x-0 flex items-center justify-center gap-0.5 text-[8px] font-semibold text-muted-foreground animate-in fade-in duration-200">
            <Eye aria-hidden className="w-2 h-2" />
            <span>Ver mais</span>
          </div>
        )}
      </button>
    );
  }
);
