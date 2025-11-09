import { Clock, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { ClassWithRoom } from "./types";

type ClassCardProps = {
  classItem: ClassWithRoom;
  isSelected: boolean;
  isDark: boolean;
  onToggle: () => void;
};

export default function ClassCard({ classItem, isSelected, isDark, onToggle }: ClassCardProps) {
  return (
    <Card
      className={`p-3 cursor-pointer transition-all ${
        isSelected
          ? isDark
            ? "bg-blue-500/20 border-blue-400"
            : "bg-blue-50 border-blue-300"
          : isDark
            ? "bg-white/5 border-white/10 hover:bg-white/10"
            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          onClick={e => e.stopPropagation()}
        />
        <div className="flex-1 min-w-0">
          <p
            className="font-semibold text-sm mb-1"
            style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
          >
            {classItem.nome.trim()}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span style={{ color: isDark ? "#E5F6FF/80" : "#0e3a6c/80" }}>
              {classItem.codigo} - Turma {classItem.turma}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span style={{ color: isDark ? "#E5F6FF/80" : "#0e3a6c/80" }}>
                {classItem.room.bloco} {classItem.room.nome}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span style={{ color: isDark ? "#E5F6FF/80" : "#0e3a6c/80" }}>
                {classItem.horario}
              </span>
            </span>
            {classItem.docente && (
              <span style={{ color: isDark ? "#E5F6FF/80" : "#0e3a6c/80" }}>
                Prof. {classItem.docente.trim()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
