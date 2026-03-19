import { PageHeader } from "@/components/ui/page-header";
import type { PaasCenterResponse } from "@/lib/shared/types";
import { Calendar } from "lucide-react";

type CalendarioHeaderProps = {
  data: PaasCenterResponse;
  isDark: boolean;
};

export default function CalendarioHeader({ data, isDark }: CalendarioHeaderProps) {
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
            <span>{data.date}</span>
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
              SACII
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
