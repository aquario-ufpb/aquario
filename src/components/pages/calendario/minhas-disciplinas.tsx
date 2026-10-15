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
import { useCalendarRoomBindings } from "@/lib/client/hooks/use-calendar-room-bindings";
import { useOwnSigaaAcademicState } from "@/lib/client/hooks/use-sigaa";
import { normalizeAcademicCode } from "@/lib/shared/sigaa/combine-academic-display";
import { projectSigaaEnrollments } from "@/lib/client/calendario/project-sigaa-enrollments";
import { SigaaEnrollments } from "./sigaa-enrollments";
import CalendarGrid from "./calendar-grid";
import { ManualScheduleForm } from "./manual-schedule-form";
import type { ClassWithRoom } from "./types";
import { DAY_NUMBERS, CALENDAR_TIME_SLOTS, CLASS_COLORS } from "@/lib/client/calendario/constants";
import { formatHorario, parseHorarioToSlots } from "@/lib/client/calendario/utils";
import {
  matchesDisciplineCode,
  resolveEnrolledClasses,
} from "@/lib/client/calendario/resolve-enrolled-classes";
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
  const isCheckingPrereqRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;

  const { data: semestreData, isLoading: semestreLoading } = useDisciplinasSemestreAtivo();
  const sigaa = useOwnSigaaAcademicState();
  const snapshot = sigaa.data?.snapshot?.payload ?? null;
  const calendarSemester = semestreNome ?? snapshot?.identity.sourceSemester ?? undefined;
  const roomBindings = useCalendarRoomBindings(calendarSemester, !!snapshot);
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

  const imported = useMemo(
    () =>
      projectSigaaEnrollments(
        snapshot,
        calendarSemester,
        semestreData?.disciplinas ?? [],
        allPaasClasses,
        paasSemestreNome,
        roomBindings.data?.bindings ?? [],
        centroSigla.trim().toUpperCase()
      ),
    [
      snapshot,
      calendarSemester,
      semestreData,
      allPaasClasses,
      paasSemestreNome,
      roomBindings.data,
      centroSigla,
    ]
  );
  const manualDisciplines = useMemo(
    () =>
      (semestreData?.disciplinas ?? []).filter(
        item => !imported.codes.has(normalizeAcademicCode(item.disciplinaCodigo))
      ),
    [semestreData, imported.codes]
  );
  const calendarResolution = useMemo(() => {
    const manual = resolveEnrolledClasses(manualDisciplines, allPaasClasses, paasMatchesDb);
    return {
      classes: [...imported.classes, ...manual.classes],
      pending: [...imported.pending, ...manual.pending],
    };
  }, [manualDisciplines, allPaasClasses, paasMatchesDb, imported]);
  const selectedCalendarClasses = calendarResolution.classes;
  const enrollmentCount = manualDisciplines.length + imported.enrollments.length;

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
    const days = selectedCalendarClasses.some(item =>
      parseHorarioToSlots(item.horario).some(slot => slot.day === 1)
    )
      ? [1, ...DAY_NUMBERS]
      : DAY_NUMBERS;
    days.forEach(day => {
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

  const disciplinas = useMemo(() => semestreData?.disciplinas ?? [], [semestreData?.disciplinas]);

  // Exclude already-added disciplines from search results
  const existingDisciplinaIds = useMemo(
    () => new Set(disciplinas.map(d => d.disciplinaId)),
    [disciplinas]
  );

  const handleAddDisciplina = useCallback(
    async (disciplinaBuscada: { id: string; codigo: string; nome: string }) => {
      if (isCheckingPrereqRef.current || marcarMutation.isPending) {
        return;
      }

      isCheckingPrereqRef.current = true;

      try {
        // 1. Busca as relações (pré-requisitos e dependentes) da disciplina selecionada
        const response = await fetch(`/api/disciplinas/${disciplinaBuscada.codigo}/relacoes`);
        if (!response.ok) {
          throw new Error("Falha ao buscar relações");
        }

        const relacoes = await response.json();

        //mapeia os códigos das disciplinas que o usuário colocou na grade
        const codigosCursando = disciplinas.map(d => d.disciplinaCodigo);

        // 2. Conflito Direto: A buscada exige alguma que já está neste mesmo semestre?
        const conflitoDireto = relacoes.preRequisitos.filter((pr: string) =>
          codigosCursando.includes(pr)
        );

        if (conflitoDireto.length > 0) {
          const nomesDireto = disciplinas
            .filter(d => conflitoDireto.includes(d.disciplinaCodigo))
            .map(d => d.disciplinaNome)
            .join(", ");

          toast.error(
            `A disciplina ${nomesDireto} é pré-requisito para ${disciplinaBuscada.nome}, que você está tentando cursar no mesmo semestre.`
          );
          return; // Interrompe a adição
        }

        // 3. Conflito Inverso: A buscada é pré-requisito de alguma já adicionada?
        const conflitoInverso = relacoes.dependentes.filter((dep: string) =>
          codigosCursando.includes(dep)
        );

        if (conflitoInverso.length > 0) {
          const nomesInversos = disciplinas
            .filter(d => conflitoInverso.includes(d.disciplinaCodigo))
            .map(d => d.disciplinaNome)
            .join(", ");

          toast.error(
            `A disciplina ${disciplinaBuscada.nome} é pré-requisito para ${nomesInversos}, que já está na sua grade atual.`
          );
          return; // Interrompe a adição
        }

        // Se passar nas verificações, faz a mutation normal
        await marcarMutation.mutateAsync({
          disciplinaIds: [disciplinaBuscada.id],
          status: "cursando",
        });
        setSearchQuery("");
        toast.success("Disciplina adicionada!");
      } catch (error) {
        console.error(error);
        toast.error("Erro ao adicionar disciplina ou verificar pré-requisitos.");
      } finally {
        isCheckingPrereqRef.current = false;
      }
    },
    [marcarMutation, disciplinas]
  );

  const filteredSearchResults = useMemo(() => {
    if (!searchResults?.disciplinas) {
      return [];
    }
    return searchResults.disciplinas.filter(
      d => !existingDisciplinaIds.has(d.id) && !imported.codes.has(normalizeAcademicCode(d.codigo))
    );
  }, [searchResults, existingDisciplinaIds, imported.codes]);

  if (!mounted) {
    return null;
  }

  if (semestreLoading || sigaa.isLoading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Carregando suas disciplinas...</p>
      </div>
    );
  }

  return (
    <div className="ph-no-capture space-y-6" data-ph-no-capture>
      {/* Left panel: Discipline list */}
      <div className="w-full min-w-0 space-y-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">
                Disciplinas Cursando
                {enrollmentCount > 0 && (
                  <span className="font-normal text-muted-foreground ml-1">
                    ({enrollmentCount})
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

            {sigaa.isError && (
              <p role="alert" className="text-xs text-amber-700 dark:text-amber-300">
                Não foi possível carregar as turmas importadas do SIGAA.{" "}
                <button className="underline" onClick={() => void sigaa.refetch()}>
                  Tentar novamente
                </button>
              </p>
            )}
            {roomBindings.isError && (
              <p role="alert" className="text-xs text-amber-700 dark:text-amber-300">
                Não foi possível carregar suas escolhas de sala.{" "}
                <button className="underline" onClick={() => void roomBindings.refetch()}>
                  Tentar novamente
                </button>
              </p>
            )}
            {imported.outdated && (
              <p role="status" className="text-xs text-amber-700 dark:text-amber-300">
                A importação SIGAA é de {snapshot?.identity.sourceSemester}. Atualize a conexão para
                conferir as turmas de {calendarSemester}.
              </p>
            )}
            {imported.enrollments.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Turmas SIGAA exibidas da última sincronização, sem precisar adicioná-las
                manualmente. Horários e salas ausentes ficam a confirmar.
              </p>
            )}
            {/* PAAS mismatch warning */}
            <p className="text-xs text-muted-foreground">
              Oferta de salas e turmas:{" "}
              <a
                className="underline"
                href="https://sa.ci.ufpb.br/"
                target="_blank"
                rel="noopener noreferrer"
              >
                SACI
              </a>
              {paasSemestreNome ? ` · ${centroSigla} · ${paasSemestreNome}` : " · aguardando dados"}
              . Turmas da matrícula extraordinária podem não constar nesta oferta; informe o horário
              manualmente nesses casos.
            </p>
            {dbSemestreNome && !paasMatchesDb && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>
                  Dados de alocação ainda não disponíveis para {dbSemestreNome}. Você pode
                  adicionar/remover disciplinas. Horários já salvos continuam visíveis; novas
                  alocações dependem da atualização do SACI.
                </span>
              </div>
            )}

            {enrollmentCount === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma disciplina cursando neste semestre. Atualize a conexão SIGAA ou adicione
                abaixo ou pela{" "}
                <a href="/grades-curriculares" className="underline hover:text-foreground">
                  Grade Curricular
                </a>
                .
              </p>
            )}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <SigaaEnrollments
                enrollments={imported.enrollments}
                allocations={allPaasClasses}
                sameSemester={paasSemestreNome === calendarSemester}
                centerId={centroSigla}
                busy={
                  roomBindings.mutation.isPending || roomBindings.isFetching || roomBindings.isError
                }
                onSave={async (sourceKey, allocationId) => {
                  try {
                    await roomBindings.mutation.mutateAsync({ sourceKey, allocationId });
                    toast.success(
                      allocationId === null
                        ? "Escolha de sala removida."
                        : "Sala SACI vinculada ao calendário."
                    );
                  } catch (error) {
                    toast.error(
                      error instanceof Error ? error.message : "Não foi possível salvar a sala."
                    );
                  }
                }}
              />
              {manualDisciplines.map(disc => {
                const paasOptions = allPaasClasses.filter(item =>
                  matchesDisciplineCode(item.codigo, disc.disciplinaCodigo)
                );
                const pending = calendarResolution.pending.find(
                  item => item.disciplineId === disc.id
                );
                const selectedOption =
                  paasOptions.find(item => item.id === disc.codigoPaas) ??
                  (disc.codigoPaas !== null &&
                  disc.turma &&
                  paasOptions.filter(item => item.turma.trim() === disc.turma?.trim()).length === 1
                    ? paasOptions.find(item => item.turma.trim() === disc.turma?.trim())
                    : undefined);
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
                        value={selectedOption ? String(selectedOption.id) : ""}
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
                              T{opt.turma} — {opt.docente?.trim() || "Sem docente"} —{" "}
                              {formatHorario(opt.horario)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Sem turmas disponíveis no SACI
                      </p>
                    )}
                    {pending && (
                      <p className="text-xs text-amber-700 dark:text-amber-300">{pending.reason}</p>
                    )}
                    <ManualScheduleForm
                      key={`${disc.id}:${disc.turma}:${disc.horario}:${disc.docente}`}
                      discipline={disc}
                    />
                  </div>
                );
              })}
            </div>

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
                  aria-label="Buscar disciplina para adicionar"
                />
              </div>
              {searchQuery.length >= 2 && (
                <div className="mt-2 space-y-1">
                  {searchLoading && (
                    <p className="text-xs text-muted-foreground text-center py-2">Buscando...</p>
                  )}
                  {!searchLoading && filteredSearchResults.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Nenhuma disciplina encontrada
                    </p>
                  )}
                  {filteredSearchResults.slice(0, 8).map(result => (
                    <button
                      key={result.id}
                      onClick={() => handleAddDisciplina(result)}
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
                  {filteredSearchResults.length > 8 && (
                    <p className="text-xs text-muted-foreground">
                      Mostrando 8 de {filteredSearchResults.length} resultados. Refine a busca pelo
                      nome ou código.
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {calendarResolution.pending.length > 0 && (
        <section
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20"
          aria-label="Pendências do calendário"
        >
          <h2 className="font-semibold text-sm">
            A definir ou conferir ({calendarResolution.pending.length})
          </h2>
          <ul className="mt-2 space-y-2 text-sm">
            {calendarResolution.pending.map(item => (
              <li key={item.disciplineId}>
                <span className="font-medium">{item.name}</span> — {item.reason}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Calendar uses the full width instead of sharing it with a wide sidebar. */}
      <div className="flex-1 min-w-0">
        {selectedCalendarClasses.length > 0 ? (
          <CalendarGrid
            selectedClasses={selectedCalendarClasses}
            classColors={classColors}
            conflicts={conflicts}
            isDark={isDark}
            calendarRef={calendarRef}
            semesterName={calendarSemester}
          />
        ) : (
          <Card>
            <CardContent className="py-20 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {!turmaSelectionAvailable
                  ? "Nenhum horário salvo para exibir. Confira as pendências acima."
                  : enrollmentCount === 0
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
