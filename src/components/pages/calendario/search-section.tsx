import { Search, X, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ClassCard from "./class-card";
import type { ClassWithRoom } from "./types";

type SearchSectionProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredClasses: ClassWithRoom[];
  selectedClassIds: Set<number>;
  selectedClasses: ClassWithRoom[];
  onToggleClass: (classId: number) => void;
  onShowCalendar: () => void;
  onClearSelection: () => void;
  isDark: boolean;
};

export default function SearchSection({
  searchQuery,
  onSearchChange,
  filteredClasses,
  selectedClassIds,
  selectedClasses,
  onToggleClass,
  onShowCalendar,
  onClearSelection,
  isDark,
}: SearchSectionProps) {
  return (
    <Card className={`mb-8 ${isDark ? "bg-white/5 border-white/20" : "bg-white border-slate-200"}`}>
      <CardHeader>
        <CardTitle
          className="flex items-center gap-2"
          style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
        >
          <Search className="w-5 h-5" />
          Buscar Disciplinas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-50" />
          <Input
            type="text"
            placeholder="Buscar por código, nome, professor, localização ou horário..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-10"
            style={{
              color: isDark ? "#C8E6FA" : "#0e3a6c",
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#fff",
              borderColor: isDark ? "rgba(255,255,255,0.2)" : "#e2e8f0",
            }}
          />
        </div>

        {selectedClasses.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm font-semibold"
              style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
            >
              {selectedClasses.length} disciplina{selectedClasses.length !== 1 ? "s" : ""}{" "}
              selecionada{selectedClasses.length !== 1 ? "s" : ""}
            </span>
            <Button
              onClick={onShowCalendar}
              size="sm"
              className="rounded-full"
              style={{
                backgroundColor: isDark ? "#1a3a5c" : "#0e3a6c",
                color: isDark ? "#C8E6FA" : "#fff",
              }}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Ver Calendário
            </Button>
            <Button
              onClick={onClearSelection}
              variant="outline"
              size="sm"
              className="rounded-full"
              style={{
                borderColor: isDark ? "rgba(255,255,255,0.2)" : "#e2e8f0",
                color: isDark ? "#C8E6FA" : "#0e3a6c",
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>
        )}

        {/* Search Results / All Classes */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {!searchQuery && filteredClasses.length > 0 && (
            <p className="text-xs mb-2" style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}>
              Mostrando todas as disciplinas ({filteredClasses.length})
            </p>
          )}
          {filteredClasses.length === 0 ? (
            <p
              className="text-sm text-center py-4"
              style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}
            >
              {searchQuery ? "Nenhuma disciplina encontrada" : "Nenhuma disciplina disponível"}
            </p>
          ) : (
            filteredClasses.map(classItem => (
              <ClassCard
                key={classItem.id}
                classItem={classItem}
                isSelected={selectedClassIds.has(classItem.id)}
                isDark={isDark}
                onToggle={() => onToggleClass(classItem.id)}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
