"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { usePaasCalendar, useDisciplinasSemestreAtivo } from "@/lib/client/hooks";
import {
  useMarcarDisciplinas,
  usePatchDisciplinaSemestre,
  useSearchDisciplinas,
} from "@/lib/client/hooks/use-disciplinas-semestre";
import CalendarGrid from "./calendar-grid";
import type { ClassWithRoom } from "./types";
import { DAY_NUMBERS, CALENDAR_TIME_SLOTS, CLASS_COLORS } from "@/lib/client/calendario/constants";
import { parseHorarioToSlots } from "@/lib/client/calendario/utils";
import type { PaasRoom } from "@/lib/shared/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, BookOpen, Plus, Loader2, Calendar, AlertTriangle } from "lucide-react";

type MinhasDisciplinasProps = {
  centroSigla: string;
  semestreNome?: string;
};

export function MinhasDisciplinas({ centroSigla, semestreNome }: MinhasDisciplinasProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;

  const { data: semestreData, isLoading: semestreLoading } = useDisciplinasSemestreAtivo();
  const { data: paasData } = usePaasCalendar(centroSigla);
  const marcarMutation = useMarcarDisciplinas();
  const patchMutation = usePatchDisciplinaSemestre();
  const { data: searchResults, isLoading: searchLoading } = useSearchDisciplinas(searchQuery);

  // DB semester is source of truth; PAAS must match for turma selection
  const dbSemestreNome = semestreNome;
  const paasSemestreNome = paasData?.description?.match(/(\d{4}\.\d)/)?.[1];
  const paasMatchesDb =
    !!dbSemestreNome && !!paasSemestreNome && paasSemestreNome === dbSemestreNome;
  const turmaSelectionAvailable = paasMatchesDb;

  // Extract all PAAS classes with room info
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

  // Group PAAS classes by discipline code for turma picker
  const paasClassesByCodigo = useMemo(() => {
    const map = new Map<string, ClassWithRoom[]>();
    allPaasClasses.forEach(c => {
      const existing = map.get(c.codigo) || [];
      existing.push(c);
      map.set(c.codigo, existing);
    });
    return map;
  }, [allPaasClasses]);

  // Derive calendar classes from semester data where turma is assigned (codigoPaas set)
  const selectedCalendarClasses = useMemo(() => {
    if (!semestreData?.disciplinas?.length) {
      return [];
    }
    return semestreData.disciplinas
      .filter(d => d.codigoPaas !== null)
      .map(d => allPaasClasses.find(c => c.id === d.codigoPaas))
      .filter((c): c is ClassWithRoom => c !== undefined);
  }, [semestreData, allPaasClasses]);

  // Calendar colors
  const classColors = useMemo(() => {
    const map = new Map<number, string>();
    selectedCalendarClasses.forEach((c, i) => {
      map.set(c.id, CLASS_COLORS[i % CLASS_COLORS.length]);
    });
    return map;
  }, [selectedCalendarClasses]);

  // Calendar conflicts
  const conflicts = useMemo(() => {
    const list: Array<{ day: number; timeSlot: number; classes: ClassWithRoom[] }> = [];
    DAY_NUMBERS.forEach(day => {
      CALENDAR_TIME_SLOTS.forEach(timeSlot => {
        const slotClasses = selectedCalendarClasses.filter(c => {
          const slots = parseHorarioToSlots(c.horario);
          return slots.some(slot => {
            const data = CALENDAR_TIME_SLOTS[timeSlot.index - 1];
            if (!data) {
              return false;
            }
            return (
              slot.day === day && slot.period === data.period && slot.slotInPeriod === data.slot
            );
          });
        });
        if (slotClasses.length > 1) {
          list.push({ day, timeSlot: timeSlot.index, classes: slotClasses });
        }
      });
    });
    return list;
  }, [selectedCalendarClasses]);

  const handleRemoveDisciplina = useCallback(
    async (disciplinaId: string) => {
      try {
        await marcarMutation.mutateAsync({ disciplinaIds: [disciplinaId], status: "none" });
        toast.success("Disciplina removida.");
      } catch {
        toast.error("Erro ao remover disciplina.");
      }
    },
    [marcarMutation]
  );

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

  const handleAddDisciplina = useCallback(
    async (disciplinaId: string) => {
      try {
        await marcarMutation.mutateAsync({ disciplinaIds: [disciplinaId], status: "cursando" });
        setSearchQuery("");
        toast.success("Disciplina adicionada!");
      } catch {
        toast.error("Erro ao adicionar disciplina.");
      }
    },
    [marcarMutation]
  );

  const disciplinas = useMemo(() => semestreData?.disciplinas ?? [], [semestreData?.disciplinas]);

  // Exclude already-added disciplines from search results
  const existingDisciplinaIds = useMemo(
    () => new Set(disciplinas.map(d => d.disciplinaId)),
    [disciplinas]
  );

  const filteredSearchResults = useMemo(() => {
    if (!searchResults?.disciplinas) {
      return [];
    }
    return searchResults.disciplinas.filter(d => !existingDisciplinaIds.has(d.id));
  }, [searchResults, existingDisciplinaIds]);

  if (!mounted) {
    return null;
  }

  if (semestreLoading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Carregando suas disciplinas...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left panel: Discipline list */}
      <div className="lg:w-[420px] flex-shrink-0 space-y-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">
                Disciplinas Cursando
                {disciplinas.length > 0 && (
                  <span className="font-normal text-muted-foreground ml-1">
                    ({disciplinas.length})
                  </span>
                )}
              </span>
            </div>

            {/* No active semester warning */}
            {!dbSemestreNome && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>Nenhum semestre letivo ativo. Não é possível marcar disciplinas.</span>
              </div>
            )}

            {/* PAAS mismatch warning */}
            {dbSemestreNome && !paasMatchesDb && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>
                  Dados de alocação ainda não disponíveis para {dbSemestreNome}. Você pode
                  adicionar/remover disciplinas, mas a seleção de turmas e calendário estarão
                  disponíveis quando o SACI for atualizado.
                </span>
              </div>
            )}

            {disciplinas.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma disciplina cursando. Adicione abaixo ou pela{" "}
                <a href="/grades-curriculares" className="underline hover:text-foreground">
                  Grade Curricular
                </a>
                .
              </p>
            )}

            {disciplinas.map(disc => {
              const paasOptions = paasClassesByCodigo.get(disc.disciplinaCodigo) ?? [];
              return (
                <div key={disc.id} className="p-3 rounded-lg border bg-card flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight">{disc.disciplinaNome}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {disc.disciplinaCodigo}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      disabled={marcarMutation.isPending}
                      onClick={() => handleRemoveDisciplina(disc.disciplinaId)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Turma selector */}
                  {!turmaSelectionAvailable ? (
                    <p className="text-xs text-muted-foreground italic">
                      Seleção de turmas indisponível
                    </p>
                  ) : paasOptions.length > 0 ? (
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

            {/* Add discipline section */}
            <div className="pt-3 border-t">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Adicionar disciplina..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 text-xs pl-8"
                />
              </div>
              {searchQuery.length >= 2 && (
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                  {searchLoading && (
                    <p className="text-xs text-muted-foreground text-center py-2">Buscando...</p>
                  )}
                  {!searchLoading && filteredSearchResults.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Nenhuma disciplina encontrada
                    </p>
                  )}
                  {filteredSearchResults.map(result => (
                    <button
                      key={result.id}
                      onClick={() => handleAddDisciplina(result.id)}
                      disabled={marcarMutation.isPending}
                      className="w-full text-left p-2 rounded-md hover:bg-accent text-xs flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-medium">{result.nome}</span>
                        <span className="text-muted-foreground ml-1 font-mono">
                          {result.codigo}
                        </span>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right panel: Calendar */}
      <div className="flex-1 min-w-0">
        {selectedCalendarClasses.length > 0 && turmaSelectionAvailable ? (
          <CalendarGrid
            selectedClasses={selectedCalendarClasses}
            classColors={classColors}
            conflicts={conflicts}
            isDark={isDark}
            calendarRef={calendarRef}
            semesterName={dbSemestreNome}
          />
        ) : (
          <Card>
            <CardContent className="py-20 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {!turmaSelectionAvailable
                  ? "Calendário disponível quando os dados de alocação forem atualizados."
                  : disciplinas.length === 0
                    ? "Adicione disciplinas para visualizar seu calendário."
                    : "Selecione turmas para visualizar seu calendário."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
