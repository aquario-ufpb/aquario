"use client";

import { useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { usePaasCalendar, useDisciplinasSemestreAtivo } from "@/lib/client/hooks";
import { usePatchDisciplinaSemestre } from "@/lib/client/hooks/use-disciplinas-semestre";
import { BookOpen, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { PaasRoom } from "@/lib/shared/types";

type ClassWithRoom = {
  id: number;
  codigo: string;
  nome: string;
  turma: string;
  docente: string;
  horario: string;
  room: { bloco: string; nome: string };
};

type TurmasStepProps = {
  onComplete: () => Promise<void>;
  isMutating: boolean;
  paasAvailable: boolean;
};

export function TurmasStep({ onComplete, isMutating, paasAvailable }: TurmasStepProps) {
  const { data: user } = useCurrentUser();
  const { data: semestreData } = useDisciplinasSemestreAtivo();
  const { data: paasData } = usePaasCalendar(user?.centro?.sigla);
  const patchMutation = usePatchDisciplinaSemestre();

  const allPaasClasses = useMemo(() => {
    if (!paasData?.solution?.solution) {
      return [];
    }
    const classes: ClassWithRoom[] = [];
    paasData.solution.solution.forEach((room: PaasRoom) => {
      if (room.classes?.length) {
        room.classes.forEach(c =>
          classes.push({ ...c, room: { bloco: room.bloco, nome: room.nome } })
        );
      }
    });
    return classes;
  }, [paasData]);

  const paasClassesByCodigo = useMemo(() => {
    const map = new Map<string, ClassWithRoom[]>();
    allPaasClasses.forEach(c => {
      const existing = map.get(c.codigo) || [];
      existing.push(c);
      map.set(c.codigo, existing);
    });
    return map;
  }, [allPaasClasses]);

  const disciplinas = useMemo(() => semestreData?.disciplinas ?? [], [semestreData?.disciplinas]);

  const handleSelectTurma = useCallback(
    async (disciplinaSemestreId: string, paasClassId: number) => {
      const paasClass = allPaasClasses.find(c => c.id === paasClassId);
      if (!paasClass) {
        return;
      }

      try {
        await patchMutation.mutateAsync({
          disciplinaSemestreId,
          data: {
            turma: paasClass.turma,
            docente: paasClass.docente,
            horario: paasClass.horario,
            codigoPaas: paasClass.id,
          },
        });
        toast.success(`Turma ${paasClass.turma} selecionada!`);
      } catch {
        toast.error("Erro ao selecionar turma.");
      }
    },
    [allPaasClasses, patchMutation]
  );

  const handleClearTurma = useCallback(
    async (disciplinaSemestreId: string) => {
      try {
        await patchMutation.mutateAsync({
          disciplinaSemestreId,
          data: { turma: null, docente: null, horario: null, codigoPaas: null },
        });
        toast.success("Turma removida.");
      } catch {
        toast.error("Erro ao remover turma.");
      }
    },
    [patchMutation]
  );

  if (!paasAvailable) {
    return (
      <div className="space-y-4 py-4">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Dados de alocação indisponíveis</p>
            <p className="text-xs text-muted-foreground">
              Os dados de turmas ainda não estão disponíveis para este semestre. Você poderá
              selecionar suas turmas pela página de calendário quando estiverem disponíveis.
            </p>
          </div>
        </div>
        <Button onClick={onComplete} disabled={isMutating}>
          Continuar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Selecionar Turmas</h2>
        <p className="text-sm text-muted-foreground">
          Para cada disciplina, selecione a turma em que está matriculado.
        </p>
      </div>

      {disciplinas.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            Nenhuma disciplina cursando encontrada. Você pode adicionar turmas depois pela página de
            calendário.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {disciplinas.map(disc => {
            const paasOptions = paasClassesByCodigo.get(disc.disciplinaCodigo) ?? [];
            return (
              <div key={disc.id} className="p-3 rounded-lg border bg-card space-y-2">
                <div>
                  <p className="text-sm font-medium">{disc.disciplinaNome}</p>
                  <p className="text-xs text-muted-foreground font-mono">{disc.disciplinaCodigo}</p>
                </div>
                {paasOptions.length > 0 ? (
                  <Select
                    value={disc.codigoPaas !== null ? String(disc.codigoPaas) : ""}
                    onValueChange={val => {
                      if (val === "__clear__") {
                        handleClearTurma(disc.id);
                      } else {
                        handleSelectTurma(disc.id, Number(val));
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Selecionar turma..." />
                    </SelectTrigger>
                    <SelectContent>
                      {disc.codigoPaas !== null && (
                        <SelectItem value="__clear__" className="text-xs text-muted-foreground">
                          Remover turma
                        </SelectItem>
                      )}
                      {paasOptions.map(opt => (
                        <SelectItem key={opt.id} value={String(opt.id)} className="text-xs">
                          T{opt.turma} — {opt.docente?.trim() || "Sem docente"} — {opt.horario}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Sem turmas disponíveis no PAAS
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
