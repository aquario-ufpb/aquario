"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePatchDisciplinaSemestre } from "@/lib/client/hooks/use-disciplinas-semestre";
import { parseHorarioToSlots } from "@/lib/client/calendario/utils";
import type { DisciplinaSemestreResponse } from "@/lib/shared/types/disciplina-semestre.types";

export function ManualScheduleForm({ discipline }: { discipline: DisciplinaSemestreResponse }) {
  const id = useId();
  const [turma, setTurma] = useState(discipline.turma ?? "");
  const [schedule, setSchedule] = useState(discipline.horario ?? "");
  const [teacher, setTeacher] = useState(discipline.docente ?? "");
  const mutation = usePatchDisciplinaSemestre();

  return (
    <details className="border-t pt-2 text-xs">
      <summary className="cursor-pointer font-medium py-1">
        Informar turma de outra oferta ou horário manual
      </summary>
      <p className="my-2 text-muted-foreground">
        Para matrícula extraordinária ou turma que não aparece no SACI. Confira o horário no SIGAA;
        a sala ficará a confirmar.
      </p>
      <form
        className="space-y-2"
        onSubmit={async event => {
          event.preventDefault();
          const horario = schedule.trim().toUpperCase();
          if (!turma.trim() || parseHorarioToSlots(horario).length === 0) {
            toast.error("Informe a turma e um horário válido, como 35M23 ou 2M12 4T34.");
            return;
          }
          try {
            await mutation.mutateAsync({
              disciplinaSemestreId: discipline.id,
              data: {
                turma: turma.trim(),
                horario,
                docente: teacher.trim() || null,
                codigoPaas: null,
              },
            });
            toast.success("Horário salvo. A turma já pode ser exibida no calendário.");
          } catch {
            toast.error("Não foi possível salvar o horário.");
          }
        }}
      >
        <div>
          <Label htmlFor={`${id}-turma`}>Turma</Label>
          <Input
            id={`${id}-turma`}
            value={turma}
            onChange={event => setTurma(event.target.value)}
            placeholder="Ex.: 07"
            maxLength={64}
            required
          />
        </div>
        <div>
          <Label htmlFor={`${id}-horario`}>Horário do SIGAA</Label>
          <Input
            id={`${id}-horario`}
            value={schedule}
            onChange={event => setSchedule(event.target.value)}
            placeholder="Ex.: 35M23"
            aria-describedby={`${id}-help`}
            maxLength={256}
            required
          />
          <p id={`${id}-help`} className="mt-1 text-muted-foreground">
            Cole o código do horário. Para mais de um bloco, separe por espaço.
          </p>
        </div>
        <div>
          <Label htmlFor={`${id}-docente`}>Docente (opcional)</Label>
          <Input
            id={`${id}-docente`}
            value={teacher}
            onChange={event => setTeacher(event.target.value)}
            maxLength={256}
          />
        </div>
        <Button type="submit" size="sm" disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Salvar horário"}
        </Button>
        {discipline.horario && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={mutation.isPending}
            onClick={async () => {
              try {
                await mutation.mutateAsync({
                  disciplinaSemestreId: discipline.id,
                  data: { turma: null, horario: null, docente: null, codigoPaas: null },
                });
                toast.success("Horário removido.");
              } catch {
                toast.error("Não foi possível remover o horário.");
              }
            }}
          >
            Remover horário
          </Button>
        )}
      </form>
    </details>
  );
}
