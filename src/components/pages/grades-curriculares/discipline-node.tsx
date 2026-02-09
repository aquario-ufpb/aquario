import { forwardRef } from "react";
import type { GradeDisciplinaNode, NaturezaDisciplinaType } from "@/lib/shared/types";
import { Eye } from "lucide-react";

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
  isClicked: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

export const DisciplineNode = forwardRef<HTMLButtonElement, DisciplineNodeProps>(
  function DisciplineNode(
    { discipline, isHighlighted, isFaded, isClicked, onClick, onMouseEnter, onMouseLeave },
    ref
  ) {
    const colors = NATUREZA_COLORS[discipline.natureza] ?? NATUREZA_COLORS.OBRIGATORIA;
    const hasPreReqs = discipline.preRequisitos.length > 0;

    return (
      <button
        ref={ref}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`
          w-full text-left rounded-md border p-2 transition-all duration-200 cursor-pointer
          ${colors.bg} ${colors.border} ${colors.text}
          ${isHighlighted ? "ring-2 ring-blue-500 dark:ring-blue-400 shadow-md scale-[1.01] z-10" : ""}
          ${isFaded ? "opacity-30" : ""}
          ${!isHighlighted && !isFaded ? "hover:shadow-sm hover:scale-[1.005]" : ""}
        `}
      >
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
        {/* "Ver mais" button when clicked */}
        {isClicked && (
          <div className="mt-2 pt-2 border-t border-current/20 flex items-center justify-center gap-1 text-[10px] font-semibold animate-in fade-in duration-200">
            <Eye className="w-3 h-3" />
            <span>Ver mais</span>
          </div>
        )}
      </button>
    );
  }
);
