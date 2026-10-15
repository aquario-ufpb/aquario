"use client";

import Link from "next/link";
import {
  CalendarDays,
  Link2,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ListOrdered,
  Clock3,
  LoaderCircle,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { useOwnSigaaAcademicState } from "@/lib/client/hooks/use-sigaa";
import { useDisciplinasConcluidas } from "@/lib/client/hooks/use-disciplinas-concluidas";
import { useSemestres } from "@/lib/client/hooks/use-calendario-academico";
import { privateQueryKeys } from "@/lib/client/query-keys";
import { apiClient } from "@/lib/client/api/api-client";
import { throwApiError } from "@/lib/client/errors";
import { OFFERING_CACHE_TTL_MS } from "@/lib/shared/planner/cache";
import { plannerApi } from "@/lib/client/planner/api";
import { usePlannerSolver } from "@/lib/client/planner/use-planner-solver";
import type { OfferingBatchResponse } from "@/lib/shared/planner/offering-search";
import { normalizeCurriculumCode } from "@/lib/shared/sigaa/curriculum-code";
import { buildAcademicContext } from "@/lib/shared/planner/academic-context";
import { simulateApprovals } from "@/lib/shared/planner/simulated-approvals";
import { normalizeCode } from "@/lib/shared/planner/requirements";
import { matchPublicCourse } from "@/lib/shared/planner/course-match";
import { mergeOfferings } from "@/lib/shared/planner/merge-offerings";
import {
  draftSchema,
  emptyDraft,
  semesterSchema,
  type PlannerDraft,
  type PlannerGoal,
  type PlannerOffer,
  type PlanSummary,
} from "@/lib/shared/planner/types";
import type { GradeCurricularResponse } from "@/lib/shared/types/curriculo.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AvailabilityEditor, selectClass } from "./availability-editor";
import { CoursePicker } from "./course-picker";
import { ProgressSettings } from "./progress-settings";
import { SettingsEditor } from "./settings-editor";
import { CustomOfferForm } from "./custom-offer-form";
import { OffersList } from "./offers-list";
import { GoalsList } from "./goals-list";
import { PlannerResults } from "./planner-results";

const message = (error: unknown) =>
  error instanceof Error ? error.message : "Não foi possível concluir a operação.";
export function EnrollmentPlanner() {
  const { userId } = useAuth();
  return <PlannerWorkspace key={userId ?? "guest"} />;
}
function PlannerWorkspace() {
  const { userId, token } = useAuth();
  const { data: user } = useCurrentUser();
  const sigaa = useOwnSigaaAcademicState();
  const manual = useDisciplinasConcluidas();
  const { data: semesters } = useSemestres();
  const snapshot = sigaa.data?.snapshot?.payload ?? null;
  const [draft, setDraft] = useState<PlannerDraft>(() =>
    emptyDraft(`${new Date().getFullYear()}.${new Date().getMonth() < 6 ? 1 : 2}`)
  );
  const [calculatedChoices, setCalculatedChoices] = useState<string | null>(null);
  const [calculatedOffers, setCalculatedOffers] = useState<PlannerOffer[] | null>(null);
  const [calculationWasPartial, setCalculationWasPartial] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [assumePassed, setAssumePassed] = useState(false);
  const [name, setName] = useState("Meu planejamento");
  const [existing, setExisting] = useState<PlanSummary | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [scenarioRevision, setScenarioRevision] = useState(0);
  const refreshOwnOffers = useRef(false);
  const refreshBroadOffers = useRef(false);
  const [broadRetry, setBroadRetry] = useState(0);
  const [broadSearch, setBroadSearch] = useState({
    running: false,
    checked: 0,
    total: 0,
    failed: 0,
    error: "",
  });
  const solver = usePlannerSolver();
  const resultsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (solver.result) {
      resultsRef.current?.focus({ preventScroll: true });
      resultsRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    }
  }, [solver.result]);
  const queryClient = useQueryClient();
  const plansKey = [...privateQueryKeys.byUser(userId), "enrollment-plans"];
  const courses = useQuery({
    queryKey: ["planner", "sigaa-courses"],
    queryFn: plannerApi.courses,
    staleTime: 86400000,
    retry: false,
  });
  const plans = useQuery({
    queryKey: plansKey,
    queryFn: plannerApi.list,
    enabled: Boolean(userId && token),
    retry: false,
  });
  const curriculumCode = snapshot ? normalizeCurriculumCode(snapshot.curriculum.code) : null;
  const grade = useQuery({
    queryKey: ["planner", "grade", user?.curso.id, curriculumCode],
    queryFn: async () => {
      const params = new URLSearchParams({ cursoId: user?.curso.id ?? "" });
      if (curriculumCode) {
        params.set("codigo", curriculumCode);
      }
      const response = await apiClient(`/curriculos/grade?${params}`);
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        await throwApiError(response);
      }
      return response.json() as Promise<GradeCurricularResponse>;
    },
    enabled: Boolean(user?.curso.id),
    retry: false,
    staleTime: 300000,
  });
  const academic = useMemo(
    () =>
      buildAcademicContext(
        grade.data ?? null,
        snapshot,
        manual.data?.disciplinas.map(item => item.code) ?? []
      ),
    [grade.data, snapshot, manual.data]
  );
  const goals = useMemo(() => {
    const all = new Map(academic.goals.map(goal => [goal.code, goal]));
    for (const custom of draft.customGoals) {
      if (!all.has(custom.code)) {
        all.set(custom.code, custom);
      }
    }
    return [...all.values()].map(goal => ({
      ...goal,
      priority: draft.priorities[goal.code] ?? "optional",
    }));
  }, [academic.goals, draft.customGoals, draft.priorities]);
  const simulation = useMemo(
    () => simulateApprovals(goals, assumePassed ? academic.enrolledCodes : []),
    [goals, assumePassed, academic.enrolledCodes]
  );
  const activePriorityOrder = draft.priorityOrder.filter(code =>
    simulation.goals.some(
      goal =>
        goal.code === code &&
        !goal.completed &&
        (draft.settings.includeOptional || goal.curricularRequired !== false)
    )
  );
  const update = (change: (previous: PlannerDraft) => PlannerDraft) => {
    solver.invalidate();
    setDraft(change);
  };
  const identifiedCourse = matchPublicCourse(
    courses.data?.courses ?? [],
    snapshot?.identity.sourceCourse,
    user?.curso.nome
  );
  const initializedWorkload = useRef(false);
  useEffect(() => {
    if (!identifiedCourse || draft.courseId || sigaa.isFetching) {
      return;
    }
    solver.invalidate();
    setDraft(previous =>
      previous.courseId ? previous : { ...previous, courseId: identifiedCourse.id }
    );
  }, [identifiedCourse?.id, draft.courseId, sigaa.isFetching]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!snapshot || initializedWorkload.current) {
      return;
    }
    initializedWorkload.current = true;
    if (existing) {
      return;
    }
    const { minimum, maximum } = snapshot.curriculum.semesterWorkload;
    solver.invalidate();
    setDraft(previous => ({
      ...previous,
      settings: {
        ...previous.settings,
        minWorkload: minimum ?? Math.min(previous.settings.minWorkload, maximum ?? Infinity),
        maxWorkload: maximum ?? Math.max(previous.settings.maxWorkload, minimum ?? 0),
      },
    }));
  }, [snapshot]); // eslint-disable-line react-hooks/exhaustive-deps
  // Imported academic updates invalidate results, but never copy a student's snapshot into saved plans.
  useEffect(() => {
    solver.invalidate();
    setAssumePassed(false);
  }, [sigaa.data?.snapshot?.installedByRunId, grade.data?.curriculoId, manual.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const ownOffers = useQuery({
    queryKey: ["planner", "offerings", draft.courseId, draft.semester],
    queryFn: async ({ signal }) => {
      const refresh = refreshOwnOffers.current;
      refreshOwnOffers.current = false;
      return {
        data: await plannerApi.offerings(draft.courseId ?? "", draft.semester, signal, refresh),
        courseId: draft.courseId,
        semester: draft.semester,
      };
    },
    enabled: Boolean(draft.courseId && semesterSchema.safeParse(draft.semester).success),
    staleTime: query =>
      query.state.data
        ? Math.max(
            0,
            Date.parse(query.state.data.data.observedAt) +
              OFFERING_CACHE_TTL_MS -
              query.state.dataUpdatedAt
          )
        : OFFERING_CACHE_TTL_MS,
    gcTime: OFFERING_CACHE_TTL_MS,
    retry: false,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    const response = ownOffers.data;
    if (!response || response.courseId !== draft.courseId || response.semester !== draft.semester) {
      return;
    }
    setDraft(previous => {
      if (previous.courseId !== response.courseId || previous.semester !== response.semester) {
        return previous;
      }
      const merged = mergeOfferings(previous.offers, response.data.offers, response.courseId ?? "");
      if (merged.length > 1500) {
        toast.error("Limite de 1500 turmas. Remova ofertas antes de consultar outro curso.");
        return previous;
      }
      return JSON.stringify(merged) === JSON.stringify(previous.offers)
        ? previous
        : { ...previous, offers: merged };
    });
    setWarnings(response.data.warnings);
  }, [ownOffers.data, draft.courseId, draft.semester, scenarioRevision]); // eslint-disable-line react-hooks/exhaustive-deps
  const searchCodes = [
    ...new Set(
      [...academic.goals, ...draft.customGoals]
        .filter(goal => !goal.completed)
        .flatMap(goal => [goal.code, ...goal.equivalents])
        .map(normalizeCode)
        .filter(code => /^[A-Z0-9]{1,64}$/.test(code))
    ),
  ]
    .sort()
    .join(",");
  const searchCourseIds = (courses.data?.courses ?? [])
    .filter(course => course.id !== draft.courseId)
    .map(course => course.id)
    .sort()
    .join(",");
  useEffect(() => {
    if (!draft.courseId || !searchCodes || !searchCourseIds || (userId && !grade.isFetched)) {
      setBroadSearch({ running: false, checked: 0, total: 0, failed: 0, error: "" });
      return;
    }
    const controller = new AbortController();
    const semester = draft.semester,
      courseId = draft.courseId,
      ids = searchCourseIds.split(","),
      codes = searchCodes.split(",");
    setBroadSearch({ running: true, checked: 0, total: ids.length, failed: 0, error: "" });
    const refresh = refreshBroadOffers.current;
    refreshBroadOffers.current = false;
    let remainingIds = ids;
    let cursor = 0;
    const ingest = (results: OfferingBatchResponse["results"]) =>
      setDraft(previous => {
        if (previous.semester !== semester || previous.courseId !== courseId) {
          return previous;
        }
        const merged = results.reduce(
          (offers, result) => mergeOfferings(offers, result.offers, result.course.id),
          previous.offers
        );
        if (merged.length > 1500) {
          toast.error(
            "A busca ultrapassou 1500 turmas. Reduza os códigos do cenário para concluir."
          );
          return previous;
        }
        return JSON.stringify(merged) === JSON.stringify(previous.offers)
          ? previous
          : { ...previous, offers: merged };
      });
    const consume = async () => {
      while (!controller.signal.aborted && cursor < remainingIds.length) {
        const id = remainingIds[cursor++];
        const cacheKey = [
          ...privateQueryKeys.byUser(userId),
          "planner-broad-offers",
          courseId,
          semester,
          [id],
          searchCodes,
        ];
        try {
          const cached = queryClient.getQueryState<OfferingBatchResponse>(cacheKey);
          const fresh =
            !refresh &&
            Boolean(
              cached?.data &&
              Date.now() - cached.dataUpdatedAt < OFFERING_CACHE_TTL_MS &&
              cached.data.results.every(
                result => Date.now() - Date.parse(result.observedAt) < OFFERING_CACHE_TTL_MS
              )
            );
          const response =
            fresh && cached?.data
              ? cached.data
              : await plannerApi.offeringBatch(
                  { courseIds: [id], semester, codes, ...(refresh ? { refresh: true } : {}) },
                  controller.signal
                );
          if (controller.signal.aborted) {
            return;
          }
          if (!fresh && response.failedCourseIds.length === 0) {
            queryClient.setQueryData(cacheKey, response);
          }
          ingest(response.results);
          setBroadSearch(previous => ({
            ...previous,
            checked: previous.checked + 1,
            failed: previous.failed + response.failedCourseIds.length,
          }));
        } catch (error) {
          if (controller.signal.aborted) {
            return;
          }
          // A failed portal must not stop the remaining course lookups.
          setBroadSearch(previous => ({
            ...previous,
            checked: previous.checked + 1,
            failed: previous.failed + 1,
            error: message(error),
          }));
        }
      }
    };
    void (async () => {
      // One local database read hydrates all reusable public offers, without visiting SIGAA.
      try {
        const snapshot = await plannerApi.offeringSnapshot(
          { semester, courseIds: ids, codes },
          controller.signal
        );
        if (controller.signal.aborted) {
          return;
        }
        if (!Array.isArray(snapshot.results) || !Array.isArray(snapshot.missingCourseIds)) {
          throw new Error("INVALID_OFFERING_CACHE");
        }
        ingest(snapshot.results);
        if (!refresh) {
          remainingIds = snapshot.missingCourseIds;
          setBroadSearch(previous => ({ ...previous, checked: ids.length - remainingIds.length }));
        }
      } catch {
        if (controller.signal.aborted) {
          return;
        }
        // A cache read failure falls back to the per-course loader, never an empty offer list.
      }
      await Promise.all([consume(), consume()]);
      if (!controller.signal.aborted) {
        setBroadSearch(previous => ({ ...previous, running: false }));
      }
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    draft.semester,
    draft.courseId,
    searchCodes,
    searchCourseIds,
    grade.isFetched,
    userId,
    queryClient,
    broadRetry,
  ]);
  const save = useMutation({
    mutationFn: (asNew: boolean) => plannerApi.save(name, draft, asNew ? null : existing),
    onSuccess: plan => {
      setExisting(plan);
      queryClient.invalidateQueries({ queryKey: plansKey });
      toast.success("Cenário salvo. Sua matrícula não foi alterada.");
    },
    onError: error => toast.error(message(error)),
  });
  const load = useMutation({
    mutationFn: plannerApi.load,
    onSuccess: plan => {
      solver.invalidate();
      initializedWorkload.current = true;
      setDraft(draftSchema.parse(plan.draft));
      setScenarioRevision(value => value + 1);
      setExisting(plan);
      setName(plan.name);
      setAssumePassed(false);
      setWarnings([
        "Cenário carregado com a oferta da consulta salva. Atualize o SIGAA e recalcule antes de solicitar matrícula.",
        ...(user && plan.profileCourseId !== user.curso.id
          ? ["Seu curso mudou desde este cenário. Revalide reservas e equivalências."]
          : []),
      ]);
    },
    onError: error => toast.error(message(error)),
  });
  const remove = useMutation({
    mutationFn: plannerApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plansKey });
      toast.success("Cenário excluído.");
    },
    onError: error => toast.error(message(error)),
  });
  const persistencePending = save.isPending || load.isPending || remove.isPending;
  const addCustom = (offer: PlannerOffer, goal: PlannerGoal) =>
    update(previous => {
      if (previous.customGoals.length >= 30 || previous.offers.length >= 1500) {
        toast.error("Limite de disciplinas personalizadas ou turmas atingido.");
        return previous;
      }
      return {
        ...previous,
        offers: [...previous.offers, offer],
        priorityOrder: previous.priorityOrder.includes(goal.code)
          ? previous.priorityOrder
          : [...previous.priorityOrder, goal.code],
        priorities: { ...previous.priorities, [goal.code]: "high" },
        customGoals: goals.some(item => item.code === goal.code)
          ? previous.customGoals
          : [...previous.customGoals, goal],
      };
    });
  const semesterOptions = [
    ...new Set([
      draft.semester,
      ...(semesters?.map(item => item.nome) ?? []),
      snapshot?.identity.sourceSemester ?? "",
    ]),
  ]
    .filter(value => semesterSchema.safeParse(value).success)
    .sort((a, b) => b.localeCompare(a));
  const offerSearchPending = ownOffers.isFetching || broadSearch.running;
  const offersChangedSinceCalculation =
    calculatedOffers !== null && calculatedOffers !== draft.offers;
  const choicesKey = JSON.stringify([
    draft.fixedOfferIds,
    draft.excludedOfferIds,
    draft.priorities,
    draft.priorityOrder,
  ]);
  const choicesNeedRecalculation = Boolean(
    solver.result && calculatedChoices !== null && calculatedChoices !== choicesKey
  );
  const editResultChoices = (change: (previous: PlannerDraft) => PlannerDraft) => {
    solver.cancel();
    setDraft(change);
  };
  const calculate = () => {
    const parsed = draftSchema.safeParse(draft);
    if (!parsed.success) {
      toast.error("Revise o semestre, os limites e as turmas antes de calcular.");
      return;
    }
    if (
      (draft.settings.reservationMode === "only" || !draft.settings.allowWithoutReservation) &&
      !draft.courseId
    ) {
      toast.error("Selecione seu curso para conferir reservas.");
      return;
    }
    solver.run(
      {
        semester: draft.semester,
        courseId: draft.courseId,
        priorityOrder: activePriorityOrder,
        goals: goals.map(goal => ({ ...goal, code: normalizeCode(goal.code) })),
        offers: draft.offers,
        windows: draft.windows,
        settings: draft.settings,
        fixedOfferIds: draft.fixedOfferIds,
        excludedOfferIds: draft.excludedOfferIds,
        completedCodes: academic.completedCodes,
        assumedPassedCodes: assumePassed ? academic.enrolledCodes : [],
        institutionalWorkload: snapshot?.curriculum.semesterWorkload,
      },
      () => {
        setCalculatedChoices(choicesKey);
        setCalculatedOffers(draft.offers);
        setCalculationWasPartial(
          offerSearchPending ||
            broadSearch.failed > 0 ||
            Boolean(broadSearch.error) ||
            ownOffers.isError
        );
      }
    );
  };
  const publicObservationTimes = draft.offers
    .filter(offer => offer.source === "SIGAA")
    .map(offer => Date.parse(offer.observedAt))
    .filter(Number.isFinite);
  const oldestPublicObservation = publicObservationTimes.length
    ? new Date(Math.min(...publicObservationTimes))
    : null;
  const selectedCourse = courses.data?.courses.find(course => course.id === draft.courseId);
  return (
    <div
      className="ph-no-capture mx-auto mt-20 max-w-7xl space-y-5 px-3 pt-6 pb-32 sm:px-6 sm:pt-8"
      data-ph-no-capture
    >
      <header className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Seu próximo semestre
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Planejador de matrícula
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          Encontre uma grade que caiba na sua rotina e ajude você a avançar no curso.
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            href="/calendario"
          >
            <CalendarDays size={15} />
            Meu calendário
          </Link>
          <Link
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            href="/me/academico"
          >
            <Link2 size={15} />
            Conexão SIGAA
          </Link>
        </div>
      </header>
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border p-1" aria-label="Modo do planejador">
          {[false, true].map(value => (
            <Button
              key={String(value)}
              size="sm"
              variant={advanced === value ? "default" : "ghost"}
              aria-pressed={advanced === value}
              onClick={() => setAdvanced(value)}
            >
              {value ? "Avançado" : "Simplificado"}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {advanced
            ? "Estratégia, requisitos e filtros detalhados."
            : "O essencial para montar sua grade."}{" "}
          Trocar mantém suas escolhas.
        </p>
        <nav
          aria-label="Ir para uma seção do planejador"
          className="flex flex-wrap items-center gap-1 sm:ml-auto"
        >
          {[
            { id: "planner-availability", label: "Horários" },
            { id: "planner-priorities", label: "Prioridades" },
            { id: "planner-settings", label: "Ajustes" },
            ...(solver.result ? [{ id: "planner-results", label: "Opções" }] : []),
          ].map(item => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
      {!userId && (
        <p className="rounded-lg border bg-muted/40 p-4 text-sm">
          Simule com disciplinas personalizadas ou{" "}
          <Link href="/login" className="underline">
            entre na sua conta
          </Link>{" "}
          para usar seu histórico e salvar grades.
        </p>
      )}
      {(sigaa.isError || manual.isError) && (
        <p role="alert" className="rounded-md border border-amber-300 p-3 text-sm">
          Parte dos dados acadêmicos não pôde ser carregada. Requisitos incompletos ficam a
          verificar. Atualize a conexão SIGAA ou use cenários condicionais explicitamente.
        </p>
      )}
      {grade.isError && (
        <p role="alert" className="rounded-md border border-amber-300 p-3 text-sm">
          Não foi possível consultar o catálogo de disciplinas.{" "}
          <button type="button" className="underline" onClick={() => grade.refetch()}>
            Tentar novamente
          </button>
          . Os requisitos usam apenas os dados acadêmicos disponíveis.
        </p>
      )}
      {grade.isSuccess && grade.data === null && (
        <p className="rounded-md border bg-muted/40 p-3 text-sm">
          {curriculumCode
            ? `O currículo ${curriculumCode} ainda não está no catálogo local.`
            : "Seu curso ainda não tem um currículo no catálogo local."}{" "}
          O planejador usa os dados acadêmicos disponíveis; equivalências locais ficam a verificar.
        </p>
      )}
      <Card className="rounded-xl shadow-none">
        <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs text-primary">
              1
            </span>
            Oferta do semestre
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
            <div>
              <Label htmlFor="planner-semester">Semestre</Label>
              <select
                id="planner-semester"
                className={selectClass}
                value={draft.semester}
                disabled={persistencePending}
                onChange={e => {
                  const semester = e.target.value;
                  update(previous => ({ ...previous, semester, offers: [], fixedOfferIds: [] }));
                  setExisting(null);
                }}
              >
                {semesterOptions.map(semester => (
                  <option key={semester} value={semester}>
                    {semester}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {selectedCourse
                  ? `${selectedCourse.name} · ${selectedCourse.campus}`
                  : "Curso ainda não identificado"}
              </p>
              <p className="text-xs text-muted-foreground">
                {identifiedCourse?.id === draft.courseId
                  ? "Identificado pelo seu perfil acadêmico."
                  : selectedCourse
                    ? "Reservas conferidas para este curso."
                    : "Escolha seu curso e campus para conferir as reservas."}
              </p>
              <details className="mt-2" open={!draft.courseId || undefined}>
                <summary className="cursor-pointer text-sm underline">
                  {draft.courseId ? "Alterar curso" : "Escolher curso"}
                </summary>
                <div className="mt-2">
                  <CoursePicker
                    label="Seu curso no SIGAA (para verificar reservas)"
                    courses={courses.data?.courses ?? []}
                    value={draft.courseId ?? ""}
                    onChange={courseId => {
                      update(previous => ({ ...previous, courseId }));
                    }}
                  />
                </div>
              </details>
            </div>
          </div>
          {courses.isPending && (
            <p className="text-sm" role="status">
              Consultando os cursos públicos do SIGAA…
            </p>
          )}
          {courses.isError && (
            <div className="text-sm">
              <p>O SIGAA não retornou a lista de cursos.</p>
              <Button size="sm" variant="outline" onClick={() => courses.refetch()}>
                Tentar carregar cursos
              </Button>
            </div>
          )}
          {(ownOffers.isFetching || broadSearch.running) && (
            <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
              <LoaderCircle
                size={14}
                className="shrink-0 animate-spin motion-reduce:animate-none"
              />
              {broadSearch.running
                ? `Ampliando a busca pública do currículo · ${broadSearch.checked}/${broadSearch.total} ofertas de cursos consultadas`
                : `Buscando turmas no SIGAA para ${draft.semester}…`}
            </p>
          )}
          {broadSearch.running && broadSearch.total > 0 && (
            <div
              role="progressbar"
              aria-label="Cursos consultados"
              aria-valuemin={0}
              aria-valuemax={broadSearch.total}
              aria-valuenow={broadSearch.checked}
              className="h-1 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none"
                style={{ width: `${(100 * broadSearch.checked) / broadSearch.total}%` }}
              />
            </div>
          )}
          {(broadSearch.error || broadSearch.failed > 0) && (
            <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">
              Busca ampliada incompleta:{" "}
              {broadSearch.error || `${broadSearch.failed} ofertas não responderam.`} As combinações
              usam somente os dados encontrados.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => setBroadRetry(value => value + 1)}
              >
                Tentar completar busca
              </button>
            </p>
          )}
          {ownOffers.isError && (
            <div role="alert" className="space-y-2 text-sm">
              <p>Não foi possível carregar a oferta do seu curso. {message(ownOffers.error)}</p>
              <Button size="sm" variant="outline" onClick={() => ownOffers.refetch()}>
                Tentar buscar turmas novamente
              </Button>
            </div>
          )}
          {ownOffers.isSuccess &&
            !ownOffers.isFetching &&
            ownOffers.data?.data.offers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                O SIGAA não retornou turmas para este curso em {draft.semester}.
              </p>
            )}
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">
              {draft.offers.length} turmas carregadas
            </span>
            Reserva não garante vaga disponível.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>
              Oferta pública em cache por até 2h.
              {oldestPublicObservation
                ? ` Dados de ${oldestPublicObservation.toLocaleString("pt-BR", { timeZone: "America/Recife", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}.`
                : ""}
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 text-xs"
              disabled={!draft.courseId || ownOffers.isFetching || broadSearch.running}
              onClick={() => {
                refreshOwnOffers.current = true;
                refreshBroadOffers.current = true;
                void ownOffers.refetch();
                setBroadRetry(value => value + 1);
              }}
            >
              <RefreshCw size={13} />
              Atualizar ofertas
            </Button>
          </div>
          <div className="space-y-2 border-t pt-3">
            <p className="text-sm font-medium">Quais turmas considerar?</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={
                  draft.settings.offerScope === "course" &&
                  draft.settings.reservationMode === "only"
                    ? "default"
                    : "outline"
                }
                aria-pressed={
                  draft.settings.offerScope === "course" &&
                  draft.settings.reservationMode === "only"
                }
                onClick={() =>
                  update(previous => ({
                    ...previous,
                    settings: {
                      ...previous.settings,
                      offerScope: "course",
                      reservationMode: "only",
                      allowWithoutReservation: false,
                    },
                  }))
                }
              >
                Com reserva para meu curso
              </Button>
              <Button
                size="sm"
                variant={
                  draft.settings.offerScope === "curriculum" &&
                  draft.settings.reservationMode !== "only"
                    ? "default"
                    : "outline"
                }
                aria-pressed={
                  draft.settings.offerScope === "curriculum" &&
                  draft.settings.reservationMode !== "only"
                }
                onClick={() =>
                  update(previous => ({
                    ...previous,
                    settings: {
                      ...previous.settings,
                      offerScope: "curriculum",
                      reservationMode: "prefer",
                      allowWithoutReservation: true,
                    },
                  }))
                }
              >
                Todas as alternativas
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Reserva favorece a matrícula regular; alternativas ampliam a busca. Confirme vagas e
              liberação no SIGAA.
            </p>
          </div>
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer py-1">Sobre a oferta e os dados consultados</summary>
            <div className="mt-2 space-y-2">
              {" "}
              {!broadSearch.running && broadSearch.total > 0 && (
                <p className="text-xs text-muted-foreground">
                  Oferta do seu curso + {broadSearch.checked} outras ofertas consultadas para os
                  códigos do currículo.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                A busca inclui as disciplinas pendentes e equivalentes do seu currículo nas ofertas
                de todos os cursos consultados. O filtro de oferta/reserva só limita as combinações,
                não o carregamento.
              </p>
            </div>
          </details>
          {warnings.length > 0 && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">Avisos da consulta ({warnings.length})</summary>
              <ul className="mt-2 space-y-1">
                {warnings.map(text => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </details>
          )}
          {draft.offers.length > 0 && (
            <details>
              <summary className="cursor-pointer text-sm font-medium">
                Conferir turmas carregadas ({draft.offers.length}) e fixar escolhas
              </summary>
              <div className="mt-3">
                <OffersList
                  offers={draft.offers}
                  courseId={draft.courseId}
                  fixed={draft.fixedOfferIds}
                  onPin={id =>
                    editResultChoices(previous => ({
                      ...previous,
                      excludedOfferIds: previous.excludedOfferIds.filter(value => value !== id),
                      fixedOfferIds: previous.fixedOfferIds.includes(id)
                        ? previous.fixedOfferIds.filter(item => item !== id)
                        : [...previous.fixedOfferIds, id],
                    }))
                  }
                  onChange={offer =>
                    editResultChoices(previous => ({
                      ...previous,
                      offers: previous.offers.map(item => (item.id === offer.id ? offer : item)),
                    }))
                  }
                  onRemove={id =>
                    update(previous => ({
                      ...previous,
                      offers: previous.offers.filter(item => item.id !== id),
                      fixedOfferIds: previous.fixedOfferIds.filter(item => item !== id),
                    }))
                  }
                />
              </div>
            </details>
          )}
          {snapshot && (
            <p className="text-xs text-muted-foreground">
              Histórico atualizado em{" "}
              {new Date(sigaa.data?.snapshot?.synchronizedAt ?? "").toLocaleDateString("pt-BR")} ·
              currículo {snapshot.curriculum.code}
            </p>
          )}
        </CardContent>
      </Card>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Card id="planner-availability" className="scroll-mt-28 rounded-xl shadow-none">
          <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Clock3 size={15} />
              </span>
              Seus horários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-3 pb-4 sm:px-5 sm:pb-5">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={draft.settings.respectAvailability}
                onCheckedChange={value =>
                  update(previous => ({
                    ...previous,
                    settings: { ...previous.settings, respectAvailability: value === true },
                  }))
                }
              />
              Respeitar meus impedimentos
            </label>
            {!draft.settings.respectAvailability && (
              <p className="text-sm text-muted-foreground">
                Seus bloqueios serão ignorados nesta simulação; as marcações continuam salvas.
              </p>
            )}
            <AvailabilityEditor
              mode={draft.settings.availabilityMode}
              windows={draft.windows}
              onChange={windows => update(previous => ({ ...previous, windows }))}
            />
          </CardContent>
        </Card>
        <div className="min-w-0 space-y-5">
          <Card id="planner-priorities" className="scroll-mt-28 rounded-xl shadow-none">
            <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
              <CardTitle className="flex items-center gap-2.5 text-base">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ListOrdered size={15} />
                </span>
                Suas prioridades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">
              {(grade.isPending && Boolean(user)) || sigaa.isLoading ? (
                <p role="status" className="text-sm">
                  Carregando currículo e histórico…
                </p>
              ) : null}
              {academic.enrolledCodes.length > 0 && (
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={assumePassed}
                    onCheckedChange={value => {
                      solver.invalidate();
                      setAssumePassed(value === true);
                    }}
                  />
                  Simular aprovação nas disciplinas atuais ({academic.enrolledCodes.length}). As
                  opções dependentes serão condicionais.
                </label>
              )}
              {assumePassed && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">
                    Ver disciplinas consideradas aprovadas ({academic.enrolledCodes.length})
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {academic.enrolledCodes.map(code => (
                      <li key={code}>
                        {goals.find(goal => goal.code === code)?.name ?? code} · {code}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={draft.settings.includeOptional}
                  onCheckedChange={value =>
                    update(previous => ({
                      ...previous,
                      settings: { ...previous.settings, includeOptional: value === true },
                    }))
                  }
                />
                Incluir optativas para completar os mínimos
              </label>
              <GoalsList
                order={draft.priorityOrder}
                onOrder={priorityOrder =>
                  update(previous => ({
                    ...previous,
                    priorityOrder: [
                      ...priorityOrder,
                      ...previous.priorityOrder.filter(code => !priorityOrder.includes(code)),
                    ],
                  }))
                }
                goals={simulation.goals.filter(
                  goal => draft.settings.includeOptional || goal.curricularRequired !== false
                )}
                completedCodes={
                  assumePassed
                    ? [...academic.completedCodes, ...simulation.assumedPassedCodes]
                    : academic.completedCodes
                }
                onPriority={(code, priority) =>
                  update(previous => ({
                    ...previous,
                    priorities: { ...previous.priorities, [code]: priority },
                    priorityOrder:
                      priority === "high" || priority === "required"
                        ? previous.priorityOrder.includes(code)
                          ? previous.priorityOrder
                          : [...previous.priorityOrder, code]
                        : previous.priorityOrder.filter(item => item !== code),
                  }))
                }
              />
              <CustomOfferForm key={draft.semester} semester={draft.semester} onAdd={addCustom} />
              {draft.excludedOfferIds.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() =>
                    editResultChoices(previous => ({ ...previous, excludedOfferIds: [] }))
                  }
                >
                  Restaurar {draft.excludedOfferIds.length} turmas excluídas
                </Button>
              )}
              {draft.fixedOfferIds.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() =>
                    editResultChoices(previous => ({ ...previous, fixedOfferIds: [] }))
                  }
                >
                  Liberar {draft.fixedOfferIds.length} turmas fixadas
                </Button>
              )}
            </CardContent>
          </Card>
          <Card id="planner-settings" className="scroll-mt-28 rounded-xl shadow-none">
            <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
              <CardTitle className="flex items-center gap-2.5 text-base">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <SlidersHorizontal size={15} />
                </span>
                Limites e estratégia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
              <p className="text-xs text-muted-foreground">
                Carga no semestre:{" "}
                <strong className="text-foreground">
                  {draft.settings.minWorkload}–{draft.settings.maxWorkload}h
                </strong>{" "}
                · {draft.settings.minClasses}–{draft.settings.maxClasses} disciplinas
                {snapshot
                  ? ` · referência SIGAA: ${snapshot.curriculum.semesterWorkload.minimum ?? "?"}–${snapshot.curriculum.semesterWorkload.maximum ?? "?"}h`
                  : ""}
              </p>
              {advanced && (
                <ProgressSettings
                  settings={draft.settings}
                  goals={simulation.goals}
                  onChange={settings => update(previous => ({ ...previous, settings }))}
                />
              )}
              {!advanced && draft.settings.progressStrategy !== "balanced" && (
                <p className="text-xs text-muted-foreground">
                  Plano ativo:{" "}
                  {draft.settings.progressStrategy === "target"
                    ? `chegar a ${goals.find(goal => goal.code === draft.settings.progressTarget)?.name ?? "uma disciplina alvo"}`
                    : "abrir caminho no currículo"}
                  . Altere no modo avançado.
                </p>
              )}
              <SettingsEditor
                advanced={advanced}
                settings={draft.settings}
                onChange={settings => update(previous => ({ ...previous, settings }))}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div
        role="region"
        aria-label="Ações do planejamento"
        className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-xl border bg-background/95 p-2 shadow-lg backdrop-blur sm:inset-x-6 sm:p-3"
        style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="hidden text-xs text-muted-foreground sm:block">
          <p className="font-medium text-foreground">
            {draft.offers.length
              ? `${draft.offers.length} turmas · ${activePriorityOrder.length} prioridades`
              : ownOffers.isFetching
                ? "Buscando turmas do semestre…"
                : draft.courseId
                  ? "Nenhuma turma carregada para este semestre"
                  : "Escolha seu curso para carregar as turmas"}
          </p>
          <p>
            {offerSearchPending && draft.offers.length
              ? "A consulta continua em segundo plano; você já pode calcular."
              : "Simular não altera sua matrícula."}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Button
            className="h-11 flex-1 gap-2 text-sm sm:flex-none"
            size="lg"
            disabled={solver.running || !draft.offers.length}
            onClick={calculate}
          >
            {solver.running ? (
              <LoaderCircle size={17} className="animate-spin motion-reduce:animate-none" />
            ) : (
              <Sparkles size={17} />
            )}
            {solver.running
              ? "Buscando combinações…"
              : choicesNeedRecalculation
                ? "Recalcular combinações"
                : offerSearchPending
                  ? "Calcular com turmas carregadas"
                  : solver.result && offersChangedSinceCalculation
                    ? "Atualizar combinações"
                    : "Encontrar combinações"}
          </Button>
          {solver.running && (
            <Button
              variant="outline"
              className="shrink-0 px-3"
              aria-label="Cancelar cálculo"
              onClick={solver.cancel}
            >
              <X size={16} className="sm:hidden" />
              <span className="hidden sm:inline">Cancelar cálculo</span>
            </Button>
          )}
        </div>
      </div>
      {solver.error && (
        <p role="alert" className="text-destructive">
          {solver.error}
        </p>
      )}
      {solver.result && (
        <div
          id="planner-results"
          ref={resultsRef}
          tabIndex={-1}
          className="scroll-mt-28 focus:outline-none"
        >
          {(calculationWasPartial || offersChangedSinceCalculation || offerSearchPending) && (
            <div
              role="status"
              className="mb-4 rounded-lg border border-amber-300 bg-amber-50/50 p-3 text-sm dark:bg-amber-950/20"
            >
              <p className="font-medium">
                {offersChangedSinceCalculation
                  ? "Novos dados de turmas disponíveis"
                  : "Combinações com consulta parcial"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {offerSearchPending
                  ? "A busca pública continua. Estas combinações usam as turmas carregadas no momento do cálculo; outras opções podem aparecer."
                  : "Estas combinações usam os dados do último cálculo. Calcule novamente para considerar a consulta atual."}{" "}
                Uma busca parcial sem combinações não comprova ausência de opções no SIGAA.
              </p>
              {offersChangedSinceCalculation && (
                <p className="mt-1 text-xs">
                  Use o botão de calcular para atualizar; suas opções atuais continuam visíveis.
                </p>
              )}
            </div>
          )}
          <PlannerResults
            key={JSON.stringify(solver.result.solutions.map(item => item.id))}
            result={solver.result}
            goals={goals}
            completedCodes={academic.completedCodes}
            assumedPassedCodes={assumePassed ? academic.enrolledCodes : []}
            semester={draft.semester}
            fixedOfferIds={draft.fixedOfferIds}
            excludedOfferIds={draft.excludedOfferIds}
            requiredCodes={goals
              .filter(goal => goal.priority === "required")
              .map(goal => goal.code)}
            needsRecalculation={choicesNeedRecalculation}
            calculating={solver.running}
            onRecalculate={calculate}
            onUnfix={id =>
              editResultChoices(previous => ({
                ...previous,
                fixedOfferIds: previous.fixedOfferIds.filter(value => value !== id),
              }))
            }
            onUnrequire={code =>
              editResultChoices(previous => ({
                ...previous,
                priorities: { ...previous.priorities, [code]: "high" },
              }))
            }
            onToggleFix={id =>
              editResultChoices(previous => ({
                ...previous,
                excludedOfferIds: previous.excludedOfferIds.filter(value => value !== id),
                fixedOfferIds: previous.fixedOfferIds.includes(id)
                  ? previous.fixedOfferIds.filter(value => value !== id)
                  : [...previous.fixedOfferIds, id].slice(0, 12),
              }))
            }
            onExclude={id =>
              editResultChoices(previous => ({
                ...previous,
                excludedOfferIds: [...new Set([...previous.excludedOfferIds, id])],
                fixedOfferIds: previous.fixedOfferIds.filter(value => value !== id),
              }))
            }
            onFix={ids =>
              editResultChoices(previous => ({
                ...previous,
                fixedOfferIds: ids,
                excludedOfferIds: previous.excludedOfferIds.filter(id => !ids.includes(id)),
              }))
            }
          />
        </div>
      )}
      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer font-medium">Salvar e carregar cenários</summary>
        <CardContent className="space-y-4 px-3 sm:px-6">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-0">
              <Label htmlFor="scenario-name">Nome do cenário</Label>
              <Input
                id="scenario-name"
                maxLength={100}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex.: Priorizar EDO"
              />
            </div>
            <Button
              disabled={!token || persistencePending || !name.trim()}
              onClick={() => {
                if (!draftSchema.safeParse(draft).success) {
                  toast.error("Revise os dados do cenário.");
                  return;
                }
                save.mutate(false);
              }}
            >
              {save.isPending ? "Salvando…" : existing ? "Atualizar cenário" : "Salvar cenário"}
            </Button>
            {existing && (
              <Button
                variant="outline"
                disabled={persistencePending}
                onClick={() => save.mutate(true)}
              >
                Salvar como novo
              </Button>
            )}
          </div>
          {!token && (
            <p className="text-sm text-muted-foreground">
              Entre para salvar em sua conta. Nenhum histórico é guardado no navegador.
            </p>
          )}
          {plans.isError && (
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar os cenários privados. A simulação continua disponível.
            </p>
          )}
          <ul className="space-y-2">
            {plans.data?.map(plan => (
              <li
                key={plan.id}
                className="flex flex-wrap justify-between items-center gap-2 rounded-md border p-3 text-sm"
              >
                <span>
                  {plan.name} · {plan.semester} ·{" "}
                  {new Date(plan.updatedAt).toLocaleDateString("pt-BR")}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={persistencePending}
                    onClick={() => load.mutate(plan.id)}
                  >
                    Carregar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={persistencePending}
                    onClick={() => {
                      if (existing?.id === plan.id) {
                        setExisting(null);
                      }
                      remove.mutate(plan.id);
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </details>
    </div>
  );
}
