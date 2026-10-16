import { PageHeader } from "@/components/ui/page-header";
import type { PaasCenterResponse } from "@/lib/shared/types";
import { Calendar } from "lucide-react";

type CalendarioHeaderProps = {
  data: PaasCenterResponse;
  isDark: boolean;
};

export default function CalendarioHeader({ data, isDark }: CalendarioHeaderProps) {
  const solutionDate = new Date(data.solution.date);
  const updatedAt = Number.isNaN(solutionDate.getTime())
    ? null
    : solutionDate.toLocaleDateString("pt-BR", { timeZone: "America/Recife" });
  return (
    <div className="mb-8">
      <PageHeader title="Calendário de Alocação" subtitle={data.centro} />
      <div className="space-y-2">
        <div
          className="flex flex-wrap gap-4 text-sm"
          style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{updatedAt ? `Alocação de ${updatedAt}` : "Data da alocação não informada"}</span>
          </div>
          {data.description && (
            <p style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}>{data.description}</p>
          )}
          <p>
            Créditos ao{" "}
            <a
              href="https://sa.ci.ufpb.br/salas/ci"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "underline", color: isDark ? "#A1E5FF" : "#2286c3" }}
            >
              SACI
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
