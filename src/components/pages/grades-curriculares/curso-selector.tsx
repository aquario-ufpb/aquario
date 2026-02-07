import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Curso } from "@/lib/shared/types";

type CursoSelectorProps = {
  cursos: Curso[];
  selectedCursoId: string | null;
  onSelect: (cursoId: string) => void;
  isLoading: boolean;
};

export function CursoSelector({
  cursos,
  selectedCursoId,
  onSelect,
  isLoading,
}: CursoSelectorProps) {
  return (
    <div className="mb-6">
      <Select value={selectedCursoId ?? undefined} onValueChange={onSelect} disabled={isLoading}>
        <SelectTrigger className="w-full max-w-sm bg-white dark:bg-white/5 border-slate-200 dark:border-white/20">
          <SelectValue placeholder={isLoading ? "Carregando cursos..." : "Selecione um curso"} />
        </SelectTrigger>
        <SelectContent>
          {cursos.map(curso => (
            <SelectItem key={curso.id} value={curso.id}>
              {curso.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
