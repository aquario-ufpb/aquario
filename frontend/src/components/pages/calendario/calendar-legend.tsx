import type { ClassWithRoom } from "./types";

type CalendarLegendProps = {
  selectedClasses: ClassWithRoom[];
  classColors: Map<number, string>;
  isDark: boolean;
};

export default function CalendarLegend({
  selectedClasses,
  classColors,
  isDark,
}: CalendarLegendProps) {
  return (
    <div
      className="mt-4 pt-4 border-t"
      style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0" }}
    >
      <p className="text-sm font-semibold mb-2" style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>
        Legenda:
      </p>
      <div className="flex flex-wrap gap-2">
        {selectedClasses.map(classItem => (
          <div
            key={classItem.id}
            className="flex items-center gap-2 text-xs"
            style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}
          >
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: classColors.get(classItem.id) || "#3b82f6" }}
            />
            <span className="truncate max-w-[200px]">
              {classItem.codigo} - {classItem.nome.trim()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
