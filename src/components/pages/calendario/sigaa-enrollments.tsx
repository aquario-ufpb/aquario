import Link from "next/link";
import type { ImportedEnrollment } from "@/lib/client/calendario/project-sigaa-enrollments";
import { formatHorario } from "@/lib/client/calendario/utils";
import { roomCandidates, type RoomCandidate } from "@/lib/shared/calendario/room-binding";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SigaaEnrollments({
  enrollments,
  allocations,
  sameSemester,
  centerId,
  busy,
  onSave,
}: {
  enrollments: ImportedEnrollment[];
  allocations: readonly RoomCandidate[];
  sameSemester: boolean;
  centerId: string;
  busy: boolean;
  onSave: (sourceKey: string, allocationId: number | null) => Promise<void>;
}) {
  return (
    <>
      {enrollments.map(item => {
        const candidates = sameSemester
          ? roomCandidates(item.code, item.schedule, allocations)
          : [];
        return (
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
            {item.bindingOutdated && (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                A escolha de sala anterior precisa ser conferida na oferta atual.
              </p>
            )}
            {item.sourceKey && (
              <details className="border-t pt-2 text-xs">
                <summary className="cursor-pointer py-1 font-medium">
                  {item.roomSource === "SACI" ? "Trocar sala no SACI" : "Conferir sala no SACI"}
                </summary>
                {candidates.length ? (
                  <form
                    className="space-y-2 pt-2"
                    onSubmit={event => {
                      event.preventDefault();
                      const data = new FormData(event.currentTarget);
                      const allocationId = Number(data.get("allocation"));
                      if (
                        item.sourceKey &&
                        candidates.some(candidate => candidate.id === allocationId)
                      ) {
                        void onSave(item.sourceKey, allocationId);
                      }
                    }}
                  >
                    <Label htmlFor={`${item.id}-room`}>Turma e sala · SACI {centerId}</Label>
                    <select
                      id={`${item.id}-room`}
                      name="allocation"
                      required
                      defaultValue=""
                      disabled={busy}
                      className="h-10 w-full min-w-0 rounded-md border bg-background px-2 text-xs"
                    >
                      <option value="" disabled>
                        Escolha a turma que você cursa
                      </option>
                      {candidates.map(candidate => (
                        <option
                          key={`${candidate.id}:${candidate.room.bloco}:${candidate.room.nome}`}
                          value={candidate.id}
                        >
                          Turma {candidate.turma} · {candidate.room.bloco} {candidate.room.nome}
                        </option>
                      ))}
                    </select>
                    <p className="text-muted-foreground">
                      Mesmo código e horário da importação. Confirme a turma, especialmente em
                      matrícula extraordinária.
                    </p>
                    <Button size="sm" type="submit" disabled={busy}>
                      Confirmar sala
                    </Button>
                  </form>
                ) : (
                  <p className="pt-2 text-muted-foreground">
                    {sameSemester
                      ? "Nenhuma turma com este código e horário na oferta SACI do seu centro. Mantenha o local SIGAA ou confira a oferta do outro centro."
                      : "Aguarde a oferta SACI do mesmo semestre para conferir esta sala."}
                  </p>
                )}
                {item.hasRoomBinding && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs"
                    disabled={busy}
                    onClick={() => item.sourceKey && void onSave(item.sourceKey, null)}
                  >
                    Remover escolha de sala
                  </Button>
                )}
              </details>
            )}
            <Link
              href="/me/academico"
              className="mt-auto pt-1 text-xs text-muted-foreground underline"
            >
              Ver dados da conexão
            </Link>
          </div>
        );
      })}
    </>
  );
}
