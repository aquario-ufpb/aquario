import { Calendar } from "lucide-react";
import type { PaasCenterResponse } from "@/lib/types";

type CalendarioHeaderProps = {
  data: PaasCenterResponse;
  isDark: boolean;
};

export default function CalendarioHeader({ data, isDark }: CalendarioHeaderProps) {
  return (
    <div className="mb-8">
      <h1
        className="text-4xl md:text-5xl font-display font-bold mb-4"
        style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
      >
        Calendário de Alocação
      </h1>
      <div className="space-y-2">
        <p className="text-xl font-semibold" style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>
          {data.centro}
        </p>
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
