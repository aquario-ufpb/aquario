import { AlertTriangle } from "lucide-react";
import type { ClassWithRoom } from "./types";

type CalendarCellProps = {
  classes: ClassWithRoom[];
  classColors: Map<number, string>;
  isDark: boolean;
  rowSpan?: number;
  isStartOfMerge?: boolean;
  onCellClick?: () => void;
};

export default function CalendarCell({
  classes,
  classColors,
  isDark,
  rowSpan = 1,
  isStartOfMerge = false,
  onCellClick,
}: CalendarCellProps) {
  const hasConflict = classes.length > 1;

  // If this is part of a merged block but not the start, don't render anything
  if (rowSpan > 1 && !isStartOfMerge) {
    return null;
  }

  return (
    <td
      rowSpan={rowSpan > 1 ? rowSpan : undefined}
      className={`p-1 align-top relative ${classes.length > 0 && onCellClick ? "cursor-pointer" : ""}`}
      onClick={classes.length > 0 ? onCellClick : undefined}
      style={{
        backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#fff",
        border: `1px solid ${
          hasConflict
            ? isDark
              ? "rgba(239, 68, 68, 0.5)"
              : "rgba(239, 68, 68, 0.3)"
            : isDark
              ? "rgba(255,255,255,0.1)"
              : "#e2e8f0"
        }`,
        minHeight: rowSpan > 1 ? `${rowSpan * 60}px` : "60px",
        verticalAlign: "top",
      }}
    >
      {hasConflict && (
        <div
          className="absolute top-0 right-0 p-1 rounded-bl z-10"
          style={{
            backgroundColor: isDark ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)",
          }}
          title={`Conflito: ${classes.length} disciplinas no mesmo horário`}
        >
          <AlertTriangle className="w-3 h-3" style={{ color: isDark ? "#ef4444" : "#dc2626" }} />
        </div>
      )}
      {classes.map((classItem, index) => (
        <div
          key={classItem.id}
          className={`p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity ${
            hasConflict ? "ring-1 ring-red-400/50" : ""
          } ${rowSpan > 1 ? "h-full flex flex-col justify-center" : ""} ${
            index < classes.length - 1 ? "mb-1" : ""
          }`}
          style={{
            backgroundColor: classColors.get(classItem.id) || "#3b82f6",
            color: "#fff",
            ...(rowSpan > 1
              ? {
                  position: "absolute",
                  top: "4px",
                  left: "4px",
                  right: "4px",
                  bottom: "4px",
                  margin: 0,
                }
              : {}),
          }}
          title={`${classItem.nome.trim()} - ${classItem.codigo} - ${classItem.room.bloco} ${classItem.room.nome}${hasConflict ? " (Conflito de horário)" : rowSpan > 1 ? ` (${rowSpan} períodos)` : ""}`}
          onClick={e => {
            e.stopPropagation();
            if (onCellClick) {
              onCellClick();
            }
          }}
        >
          <p className="font-semibold truncate">{classItem.nome.trim()}</p>
          <p className="text-xs opacity-90 truncate">
            {classItem.room.bloco} {classItem.room.nome}
          </p>
        </div>
      ))}
    </td>
  );
}
