import Link from "next/link";
import type { ImportedEnrollment } from "@/lib/client/calendario/project-sigaa-enrollments";
import { formatHorario } from "@/lib/client/calendario/utils";

export function SigaaEnrollments({ enrollments }: { enrollments: ImportedEnrollment[] }) {
  return (
    <>
      {enrollments.map(item => (
        <div key={item.id} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight">{item.name}</p>
              {item.code && (
                <p className="mt-1 font-mono text-xs text-muted-foreground">{item.code}</p>
              )}
            </div>
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-200">
              SIGAA
            </span>
          </div>
          <p className="text-xs">
            {item.schedule ? formatHorario(item.schedule) : "Horário a confirmar no SIGAA"}
          </p>
          {item.section && <p className="text-xs text-muted-foreground">Turma {item.section}</p>}
          <p className="text-xs text-muted-foreground">
            {item.room
              ? `${item.room} · ${item.roomSource === "SACI" ? "SACI" : "SIGAA, a confirmar no SACI"}`
              : "Sala a confirmar"}
          </p>
          <Link
            href="/me/academico"
            className="mt-auto pt-1 text-xs text-muted-foreground underline"
          >
            Ver dados da conexão
          </Link>
        </div>
      ))}
    </>
  );
}
