"use client";

import { CalendarPlus, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  downloadDeadlineCalendar,
  googleDeadlineUrl,
  parseDeadlinePeriod,
} from "@/lib/client/calendario/sigaa-deadlines";
import type { SigaaAcademicSnapshotPayload } from "@/lib/shared/types/sigaa-academic";

const labels = new Map([
  ["avaliacao", "Avaliação"],
  ["atividade", "Atividade"],
  ["tarefa", "Tarefa"],
  ["enquete", "Enquete"],
]);

export function SigaaClassDeadlines({
  classItem,
  observedAt,
}: {
  classItem: Pick<
    SigaaAcademicSnapshotPayload["classes"][number],
    "sourceKey" | "name" | "deadlines"
  >;
  observedAt: string;
}) {
  if (!classItem.deadlines?.length) {
    return null;
  }
  const rows = classItem.deadlines.map(deadline => ({
    deadline,
    title: `${deadline.title} · ${classItem.name}`,
    period: parseDeadlinePeriod(deadline.date, observedAt),
  }));
  const events = rows.flatMap(({ deadline, title, period }) =>
    period
      ? [
          {
            ...period,
            uid: `sigaa.${encodeURIComponent(classItem.sourceKey)}:${encodeURIComponent(deadline.id)}@aquario`,
            title,
          },
        ]
      : []
  );

  return (
    <div className="space-y-2 border-t pt-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">Provas e atividades</p>
        {events.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void downloadDeadlineCalendar(events).catch(() =>
                toast.error("Não foi possível exportar as datas.")
              );
            }}
          >
            <Download aria-hidden="true" className="mr-1.5 h-4 w-4" />
            Exportar calendário (ICS)
          </Button>
        )}
      </div>
      <ul className="space-y-2">
        {rows.map(({ deadline, title, period }) => (
          <li
            key={deadline.id}
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
          >
            <div className="min-w-0 break-words">
              <p>{deadline.title}</p>
              <p className="text-xs text-muted-foreground">
                {labels.get(deadline.kind) ?? deadline.kind} · {deadline.date || "Data a confirmar"}
              </p>
            </div>
            {period && (
              <a
                href={googleDeadlineUrl(title, period)}
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
                className="inline-flex items-center gap-1 py-1 text-xs text-aquario-primary underline"
                aria-label={`Adicionar ${deadline.title} ao Google Calendar`}
              >
                <CalendarPlus aria-hidden="true" className="h-4 w-4" />
                Google Calendar
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
