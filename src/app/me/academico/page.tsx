"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  ChevronDown,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { trackEvent } from "@/analytics/posthog-client";
import type { SigaaConnectionState } from "@/analytics/posthog-events";
import { SigaaIntegrationCredits } from "@/components/pages/perfil/sigaa-integration-credits";
import { SigaaConnectDialog } from "@/components/pages/perfil/sigaa-connect-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SIGAA_CONSENT_VERSION } from "@/lib/client/api/sigaa";
import { useDisciplinasConcluidas } from "@/lib/client/hooks/use-disciplinas-concluidas";
import { useDisciplinasSemestreAtivo } from "@/lib/client/hooks/use-disciplinas-semestre";
import { useGradeCurricular } from "@/lib/client/hooks/use-grade-curricular";
import { useRequireAuth } from "@/lib/client/hooks/use-require-auth";
import { useOwnSigaaAcademicState } from "@/lib/client/hooks/use-sigaa";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { queryKeys } from "@/lib/client/query-keys";
import { formatHorario } from "@/lib/client/calendario/utils";
import {
  countComponentsByScope,
  getGradeTone,
  groupAcademicComponents,
  groupGradesBySemester,
  normalizeGradeOutcome,
  repairKnownAcademicDescription,
  summarizeGrades,
  type AcademicGrade,
  type ComponentScope,
  type GradeOutcome,
  type GradeTone,
} from "@/lib/client/sigaa/academic-dashboard";
import { toSigaaIntegrationView } from "@/lib/client/sigaa/view-model";
import { cn } from "@/lib/client/utils";
import {
  collectManualAcademicComponents,
  combineAcademicDisplay,
} from "@/lib/shared/sigaa/combine-academic-display";
import type { EffectiveAcademicComponent } from "@/lib/shared/types/sigaa-academic";

const stateLabels = {
  completed: "Concluída",
  enrolled: "Cursando",
  pending: "Pendente",
  unknown: "Estado desconhecido",
} as const;

const outcomeLabels: Record<GradeOutcome, string> = {
  approved: "Aprovada",
  failed_absence: "Reprovada por falta",
  failed_grade: "Reprovada por nota",
  in_progress: "Em andamento",
  unknown: "Situação não reconhecida",
};

const toneClasses: Record<GradeTone, string> = {
  danger:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  neutral: "border-border bg-muted/60 text-muted-foreground",
};

const outcomeTone: Record<GradeOutcome, GradeTone> = {
  approved: "success",
  failed_absence: "danger",
  failed_grade: "danger",
  in_progress: "warning",
  unknown: "neutral",
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(
    new Date(value)
  );

const percentFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

type AcademicConnectAction = Readonly<{
  operation: "connect" | "sync";
  consentRequired: boolean;
  connectionState: SigaaConnectionState;
  emptyStateLabel: string;
}>;

const getAcademicConnectAction = (
  connectionState: SigaaConnectionState | undefined,
  consentRequired: boolean
): AcademicConnectAction => {
  const resolvedState = connectionState ?? "never_connected";
  if (resolvedState === "never_connected") {
    return {
      operation: "connect",
      consentRequired,
      connectionState: resolvedState,
      emptyStateLabel: "Conectar e sincronizar",
    };
  }

  return {
    operation: "sync",
    consentRequired,
    connectionState: resolvedState,
    emptyStateLabel:
      resolvedState === "disconnected" ? "Reconectar e sincronizar" : "Continuar sincronização",
  };
};

type AcademicSectionProps = Readonly<{
  title: string;
  summary: string;
  icon: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}>;

function AcademicSection({
  title,
  summary,
  icon,
  defaultOpen = false,
  children,
}: AcademicSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <section className="overflow-hidden rounded-xl border bg-card" aria-label={title}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
              {icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold" role="heading" aria-level={2}>
                {title}
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{summary}</span>
            </span>
            <ChevronDown
              className={cn("h-5 w-5 shrink-0 text-muted-foreground", open && "rotate-180")}
              aria-hidden="true"
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t p-4 sm:p-5">{children}</div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}

type GroupDisclosureProps = Readonly<{
  title: string;
  summary: string;
  defaultOpen?: boolean;
  forceOpen?: boolean;
  children: ReactNode;
}>;

function GroupDisclosure({
  title,
  summary,
  defaultOpen = false,
  forceOpen = false,
  children,
}: GroupDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const resolvedOpen = forceOpen || open;

  return (
    <Collapsible open={resolvedOpen} onOpenChange={nextOpen => !forceOpen && setOpen(nextOpen)}>
      <div className="overflow-hidden rounded-lg border">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex min-h-11 w-full items-center gap-3 px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-4"
          >
            <span className="min-w-0 flex-1">
              <span className="font-medium" role="heading" aria-level={3}>
                {title}
              </span>
              <span className="ml-2 text-sm text-muted-foreground">{summary}</span>
            </span>
            <ChevronDown
              className={cn("h-4 w-4 shrink-0 text-muted-foreground", resolvedOpen && "rotate-180")}
              aria-hidden="true"
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>{children}</CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function GradeValue({
  value,
  approved = false,
}: Readonly<{ value: string | null; approved?: boolean }>) {
  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }
  const tone = getGradeTone(value, approved);
  return (
    <span
      className={cn(
        "inline-flex min-w-10 justify-center rounded-md border px-2 py-1 text-xs font-semibold tabular-nums",
        toneClasses[tone]
      )}
    >
      {value}
    </span>
  );
}

function GradeStatus({ grade }: Readonly<{ grade: AcademicGrade }>) {
  const outcome = normalizeGradeOutcome(grade.status);
  const label = outcome === "unknown" && grade.status ? grade.status : outcomeLabels[outcome];
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap", toneClasses[outcomeTone[outcome]])}>
      {label}
    </Badge>
  );
}

function ComponentRow({ component }: Readonly<{ component: EffectiveAcademicComponent }>) {
  return (
    <li className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="min-w-0">
        <p className="font-medium leading-snug">{component.presentation.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {component.code}
          {component.sigaa ? ` · ${component.sigaa.workloadHours}h` : ""}
          {component.sigaa ? ` · ${component.sigaa.integrationType}` : ""}
        </p>
        {component.sigaa &&
          component.manual &&
          component.sigaa.status !== component.manual.state && (
            <p className="mt-1 text-xs text-muted-foreground">
              Valor manual preservado: {stateLabels[component.manual.state]}.
            </p>
          )}
        {component.sigaa && (component.sigaa.prerequisite || component.sigaa.corequisite) && (
          <p className="mt-1 text-xs text-muted-foreground">
            {component.sigaa.prerequisite ? `Pré-requisito: ${component.sigaa.prerequisite}` : ""}
            {component.sigaa.prerequisite && component.sigaa.corequisite ? " · " : ""}
            {component.sigaa.corequisite ? `Correquisito: ${component.sigaa.corequisite}` : ""}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <Badge variant="outline">{stateLabels[component.presentation.state]}</Badge>
        <Badge variant="secondary">
          {component.presentation.origin === "CATALOG"
            ? "Catálogo"
            : component.presentation.origin === "MANUAL"
              ? "Manual"
              : "SIGAA"}
        </Badge>
        {component.sigaa && (
          <Badge variant="outline">{component.sigaa.required ? "Obrigatória" : "Optativa"}</Badge>
        )}
      </div>
    </li>
  );
}

function GradeCards({
  grades,
  semester,
}: Readonly<{ grades: readonly AcademicGrade[]; semester: string }>) {
  return (
    <div className="divide-y sm:hidden" role="list" aria-label={`Notas do semestre ${semester}`}>
      {grades.map(item => {
        const outcome = normalizeGradeOutcome(item.status);
        return (
          <article key={`${semester}-${item.code}`} className="space-y-3 px-3 py-4" role="listitem">
            <div>
              <h4 className="font-medium leading-snug">{item.discipline}</h4>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.code}</p>
            </div>
            <div className="flex flex-wrap gap-1.5" aria-label="Notas das unidades">
              {item.units.length ? (
                item.units.map((unit, index) => (
                  <GradeValue key={`${item.code}-unit-${index}`} value={unit} />
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Sem notas de unidades</span>
              )}
            </div>
            <dl className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Exame</dt>
                <dd className="mt-1">
                  <GradeValue value={item.exam} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Resultado</dt>
                <dd className="mt-1">
                  <GradeValue value={item.result} approved={outcome === "approved"} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Faltas</dt>
                <dd className="mt-1 font-medium tabular-nums">{item.absences ?? "—"}</dd>
              </div>
            </dl>
            <GradeStatus grade={item} />
          </article>
        );
      })}
    </div>
  );
}

function GradeTable({
  grades,
  semester,
}: Readonly<{ grades: readonly AcademicGrade[]; semester: string }>) {
  return (
    <div className="hidden overflow-x-auto sm:block">
      <table className="w-full min-w-[760px] text-left text-sm">
        <caption className="sr-only">Notas do semestre {semester}</caption>
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Componente
            </th>
            <th scope="col" className="px-3 py-3 font-medium">
              Unidades
            </th>
            <th scope="col" className="px-3 py-3 font-medium">
              Exame
            </th>
            <th scope="col" className="px-3 py-3 font-medium">
              Resultado
            </th>
            <th scope="col" className="px-3 py-3 font-medium">
              Faltas
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Situação
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {grades.map(item => {
            const outcome = normalizeGradeOutcome(item.status);
            return (
              <tr key={`${semester}-${item.code}`}>
                <td className="px-4 py-3">
                  <span className="font-medium">{item.discipline}</span>
                  <br />
                  <span className="text-xs text-muted-foreground">{item.code}</span>
                </td>
                <td className="px-3 py-3">
                  <span className="flex flex-wrap gap-1">
                    {item.units.length
                      ? item.units.map((unit, index) => (
                          <GradeValue key={`${item.code}-unit-${index}`} value={unit} />
                        ))
                      : "—"}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <GradeValue value={item.exam} />
                </td>
                <td className="px-3 py-3">
                  <GradeValue value={item.result} approved={outcome === "approved"} />
                </td>
                <td className="px-3 py-3 tabular-nums">{item.absences ?? "—"}</td>
                <td className="px-4 py-3">
                  <GradeStatus grade={item} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AcademicPageSkeleton() {
  return (
    <main className="container mx-auto max-w-5xl space-y-6 px-6 pb-24 pt-32">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-80 w-full" />
    </main>
  );
}

function MeusDadosAcademicosPageContent() {
  useRequireAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const deepLinkHandledRef = useRef(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [componentSearch, setComponentSearch] = useState("");
  const [componentScope, setComponentScope] = useState<ComponentScope>("trajectory");
  const [gradeFilter, setGradeFilter] = useState<GradeOutcome | "all">("all");
  const currentUser = useCurrentUser();
  const hasAuthenticatedUser = Boolean(currentUser.data);
  const stateQuery = useOwnSigaaAcademicState(hasAuthenticatedUser);
  const gradeQuery = useGradeCurricular(currentUser.data?.curso.id ?? null);
  const completedQuery = useDisciplinasConcluidas(hasAuthenticatedUser);
  const enrolledQuery = useDisciplinasSemestreAtivo(hasAuthenticatedUser);

  const academicDisplay = useMemo(() => {
    const catalog =
      gradeQuery.data?.disciplinas.map(item => ({
        disciplinaId: item.disciplinaId,
        code: item.codigo,
        name: item.nome,
      })) ?? [];
    const manual = collectManualAcademicComponents({
      catalog,
      completed: completedQuery.data?.disciplinas ?? [],
      enrolled:
        enrolledQuery.data?.disciplinas.map(item => ({
          disciplinaId: item.disciplinaId,
          code: item.disciplinaCodigo,
          name: item.disciplinaNome,
        })) ?? [],
    });

    return combineAcademicDisplay({
      catalog,
      manual,
      sigaa: stateQuery.data?.snapshot?.payload.curriculum.components ?? [],
    });
  }, [completedQuery.data, enrolledQuery.data, gradeQuery.data, stateQuery.data]);

  const integrationView = stateQuery.data ? toSigaaIntegrationView(stateQuery.data) : null;
  const integrationKind = integrationView?.kind;
  const connectAction = getAcademicConnectAction(
    integrationKind,
    stateQuery.data?.connection?.consentVersion !== SIGAA_CONSENT_VERSION
  );
  const componentCounts = useMemo(() => countComponentsByScope(academicDisplay), [academicDisplay]);
  const componentGroups = useMemo(
    () => groupAcademicComponents(academicDisplay, componentScope, componentSearch),
    [academicDisplay, componentScope, componentSearch]
  );
  const grades = useMemo(
    () => stateQuery.data?.snapshot?.payload.grades ?? [],
    [stateQuery.data?.snapshot?.payload.grades]
  );
  const gradeSummary = useMemo(() => summarizeGrades(grades), [grades]);
  const gradeGroups = useMemo(
    () => groupGradesBySemester(grades, gradeFilter),
    [gradeFilter, grades]
  );

  const openConnectDialog = () => {
    trackEvent("sigaa_connect_opened", {
      operation: connectAction.operation,
      consent_required: connectAction.consentRequired,
    });
    if (connectAction.operation === "sync") {
      trackEvent("sigaa_sync_again_clicked", { connection_state: connectAction.connectionState });
    }
    setConnectOpen(true);
  };

  useEffect(() => {
    if (integrationKind) {
      trackEvent("sigaa_academic_page_opened", { connection_state: integrationKind });
    }
  }, [integrationKind]);

  useEffect(() => {
    if (
      deepLinkHandledRef.current ||
      searchParams.get("connect") !== "1" ||
      !stateQuery.data ||
      integrationKind === "connected"
    ) {
      return;
    }

    deepLinkHandledRef.current = true;
    trackEvent("sigaa_connect_opened", {
      operation: connectAction.operation,
      consent_required: connectAction.consentRequired,
    });
    setConnectOpen(true);
  }, [
    connectAction.consentRequired,
    connectAction.operation,
    integrationKind,
    searchParams,
    stateQuery.data,
  ]);

  const refreshAfterSync = async (courseReplaced: boolean) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.sigaa.state(currentUser.data?.id ?? null),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.disciplinasConcluidas.me(currentUser.data?.id ?? null),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.disciplinasSemestre.ativo(currentUser.data?.id ?? null),
      }),
    ]);
    if (courseReplaced) {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.usuarios.current(currentUser.data?.id ?? null),
      });
    }
    toast.success("Dados acadêmicos atualizados");
  };

  if (
    currentUser.isLoading ||
    (hasAuthenticatedUser &&
      (stateQuery.isLoading ||
        gradeQuery.isLoading ||
        completedQuery.isLoading ||
        enrolledQuery.isLoading))
  ) {
    return <AcademicPageSkeleton />;
  }

  if (currentUser.isError && !currentUser.data) {
    return (
      <main className="container mx-auto max-w-3xl px-6 pb-24 pt-32 text-center">
        <h1 className="text-2xl font-semibold">Não foi possível carregar seu perfil</h1>
        <p className="mt-3 text-muted-foreground">
          Tente novamente para verificar seu acesso à integração SIGAA.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => currentUser.refetch()}>
            Tentar novamente
          </Button>
          <Button asChild variant="ghost">
            <Link href="/perfil">Voltar ao perfil</Link>
          </Button>
        </div>
      </main>
    );
  }

  const snapshot = stateQuery.data?.snapshot;
  if (!snapshot) {
    return (
      <main
        className="ph-no-capture container mx-auto max-w-3xl px-6 pb-24 pt-32 text-center"
        data-ph-no-capture="true"
      >
        <h1 className="text-2xl font-semibold">Meus dados acadêmicos</h1>
        <p className="mt-3 text-muted-foreground">
          {stateQuery.isError
            ? "Não foi possível carregar os dados importados."
            : "Você ainda não sincronizou um snapshot acadêmico."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {stateQuery.isError ? (
            <Button variant="outline" onClick={() => stateQuery.refetch()}>
              Tentar novamente
            </Button>
          ) : (
            <Button onClick={openConnectDialog}>{connectAction.emptyStateLabel}</Button>
          )}
          <Button asChild variant="outline">
            <Link href="/perfil">Voltar ao perfil</Link>
          </Button>
        </div>
        {stateQuery.data && (
          <SigaaConnectDialog
            open={connectOpen}
            requireConsent={connectAction.consentRequired}
            onOpenChange={setConnectOpen}
            onSynchronized={refreshAfterSync}
          />
        )}
      </main>
    );
  }

  const { payload } = snapshot;
  const totalProgress = payload.curriculum.progress.find(item => /total/i.test(item.description));
  const progressCategories = payload.curriculum.progress.filter(item => item !== totalProgress);
  const componentScopeOptions = [
    ["trajectory", "Minha trajetória", componentCounts.trajectory],
    ["pending", "Pendentes", componentCounts.pending],
    ["all", "Currículo completo", componentCounts.all],
  ] as const;
  const gradeFilterOptions = [
    ["all", "Todas", gradeSummary.total],
    ["approved", "Aprovadas", gradeSummary.approved],
    ["failed_grade", "Reprovadas por nota", gradeSummary.failedGrade],
    ["failed_absence", "Reprovadas por falta", gradeSummary.failedAbsence],
    ["in_progress", "Em andamento", gradeSummary.inProgress],
    ["unknown", "Outras", gradeSummary.unknown],
  ] as const;

  return (
    <main
      className="ph-no-capture container mx-auto max-w-5xl space-y-6 px-4 pb-24 pt-28 sm:px-6 sm:pt-32"
      data-ph-no-capture="true"
    >
      <header>
        <Button asChild variant="ghost" className="mb-4 -ml-3">
          <Link href="/perfil">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Voltar ao perfil
          </Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <GraduationCap className="mt-1 h-7 w-7 text-sky-700" aria-hidden="true" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Meus dados acadêmicos</h1>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                Atualizado em {formatDateTime(snapshot.synchronizedAt)}.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={openConnectDialog} className="self-start">
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Sincronizar novamente
          </Button>
        </div>
      </header>

      {integrationView?.kind === "disconnected" && (
        <div
          role="status"
          className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
        >
          A integração está desconectada. Este é o último snapshot preservado; sincronize novamente
          para buscar mudanças no SIGAA.
        </div>
      )}

      {stateQuery.isError && (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"
        >
          Não foi possível verificar o estado mais recente. O último snapshot salvo continua
          visível.
          <Button className="ml-3" size="sm" variant="outline" onClick={() => stateQuery.refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      <section aria-labelledby="academic-summary-heading">
        <h2 id="academic-summary-heading" className="sr-only">
          Resumo acadêmico
        </h2>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,2fr)]">
          <Card className="border-sky-200 bg-sky-50/60 dark:border-sky-900 dark:bg-sky-950/30">
            <CardContent className="flex h-full items-center justify-between gap-5 p-5 sm:p-6">
              <div>
                <p className="text-sm font-medium text-sky-800 dark:text-sky-200">CRA</p>
                <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">
                  {payload.curriculum.cra.value ?? "—"}
                </p>
              </div>
              <p className="max-w-28 text-right text-xs leading-relaxed text-muted-foreground">
                Coeficiente de rendimento acadêmico
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-3 sm:p-6">
              <div>
                <p className="text-xs text-muted-foreground">Matrícula</p>
                <p className="mt-1 font-semibold tabular-nums">{payload.identity.matricula}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Currículo</p>
                <p className="mt-1 font-semibold">{payload.curriculum.code}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Período no SIGAA</p>
                <p className="mt-1 font-semibold">
                  {payload.identity.sourceSemester ?? "Indisponível"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Curso informado</p>
                <p className="mt-1 font-medium">
                  {payload.identity.sourceCourse ?? "Indisponível"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Prazo máximo</p>
                <p className="mt-1 font-medium">
                  {payload.curriculum.maximumCompletionTerm ?? "Indisponível"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Carga semestral mínima</p>
                <p className="mt-1 font-medium tabular-nums">
                  {payload.curriculum.semesterWorkload.minimum === null
                    ? "Indisponível"
                    : `${payload.curriculum.semesterWorkload.minimum}h`}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Carga semestral máxima</p>
                <p className="mt-1 font-medium tabular-nums">
                  {payload.curriculum.semesterWorkload.maximum === null
                    ? "Indisponível"
                    : `${payload.curriculum.semesterWorkload.maximum}h`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="academic-progress-heading">
        <div className="mb-3">
          <h2 id="academic-progress-heading" className="text-xl font-semibold">
            Progresso
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Quanto do currículo você já concluiu.
          </p>
        </div>
        {payload.curriculum.progress.length > 0 ? (
          <div
            className={cn(
              "grid gap-3",
              totalProgress &&
                progressCategories.length > 0 &&
                "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
            )}
          >
            {totalProgress && (
              <Card className="border-sky-200 dark:border-sky-900">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">
                        {repairKnownAcademicDescription(totalProgress.description)}
                      </p>
                      <p className="mt-2 text-3xl font-bold tabular-nums">
                        {percentFormatter.format(totalProgress.completedPercent)}%
                      </p>
                    </div>
                    <p className="text-right text-sm text-muted-foreground">
                      <span className="font-medium text-foreground tabular-nums">
                        {totalProgress.completedHours}h
                      </span>{" "}
                      de {totalProgress.totalHours}h
                    </p>
                  </div>
                  <Progress
                    value={totalProgress.completedPercent}
                    className="mt-4 h-2.5 bg-sky-100 dark:bg-sky-950 [&>div]:bg-sky-700 [&>div]:transition-none dark:[&>div]:bg-sky-400"
                    aria-label={`Progresso total de ${percentFormatter.format(totalProgress.completedPercent)}%`}
                  />
                  <p className="mt-3 text-xs text-muted-foreground tabular-nums">
                    {totalProgress.remainingHours}h restantes
                  </p>
                </CardContent>
              </Card>
            )}
            {progressCategories.length > 0 && (
              <Card>
                <CardContent className="divide-y p-0">
                  {progressCategories.map(item => (
                    <div
                      key={item.description}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {repairKnownAcademicDescription(item.description)}
                        </p>
                        <Progress
                          value={item.completedPercent}
                          className="mt-2 h-1.5 bg-sky-100 [&>div]:bg-sky-500 [&>div]:transition-none dark:bg-sky-950 dark:[&>div]:bg-sky-500"
                          aria-label={`${repairKnownAcademicDescription(item.description)}: ${percentFormatter.format(item.completedPercent)}%`}
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {percentFormatter.format(item.completedPercent)}%
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {item.completedHours}/{item.totalHours}h
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            O SIGAA não informou o progresso do currículo neste snapshot.
          </p>
        )}
      </section>

      <AcademicSection
        title="Turmas atuais"
        summary={
          payload.classes.length === 1
            ? "1 turma neste período"
            : `${payload.classes.length} turmas neste período`
        }
        icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}
        defaultOpen={payload.classes.length > 0}
      >
        {payload.classes.length > 0 ? (
          <ul className="divide-y rounded-lg border">
            {payload.classes.map(item => (
              <li
                key={item.sourceKey}
                className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6"
              >
                <div className="min-w-0">
                  <p className="font-medium leading-snug">{item.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {[item.code, item.semester].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground sm:text-right">
                  {item.scheduleRaw && <p>{formatHorario(item.scheduleRaw)}</p>}
                  {item.room && <p>Sala {item.room}</p>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            O SIGAA não informou turmas atuais neste snapshot.
          </p>
        )}
      </AcademicSection>

      <AcademicSection
        title="Notas, resultados e faltas"
        summary={
          gradeSummary.recognizedFinals
            ? `${gradeSummary.approved} de ${gradeSummary.recognizedFinals} resultados finais aprovados`
            : "Sem resultados finais reconhecidos"
        }
        icon={<GraduationCap className="h-5 w-5" aria-hidden="true" />}
      >
        {grades.length > 0 ? (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
                <dt className="text-xs text-emerald-800 dark:text-emerald-200">Aprovadas</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">
                  {gradeSummary.approved}
                </dd>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50/60 p-3 dark:border-red-900 dark:bg-red-950/30">
                <dt className="text-xs text-red-800 dark:text-red-200">Reprovadas por nota</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">
                  {gradeSummary.failedGrade}
                </dd>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50/60 p-3 dark:border-red-900 dark:bg-red-950/30">
                <dt className="text-xs text-red-800 dark:text-red-200">Reprovadas por falta</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">
                  {gradeSummary.failedAbsence}
                </dd>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <dt className="text-xs text-muted-foreground">Aproveitamento final</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">
                  {gradeSummary.approvalRate === null
                    ? "—"
                    : `${percentFormatter.format(gradeSummary.approvalRate)}%`}
                </dd>
              </div>
            </dl>
            <div>
              <p className="mb-2 text-sm font-medium">Filtrar resultados</p>
              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-label="Filtrar notas por situação"
              >
                {gradeFilterOptions.map(([value, label, count]) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={gradeFilter === value ? "default" : "outline"}
                    aria-pressed={gradeFilter === value}
                    onClick={() => setGradeFilter(value)}
                  >
                    {label}
                    <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
                  </Button>
                ))}
              </div>
            </div>
            {gradeGroups.length > 0 ? (
              <div className="space-y-2">
                {gradeGroups.map((group, index) => (
                  <GroupDisclosure
                    key={`${gradeFilter}-${group.semester}`}
                    title={group.semester}
                    summary={`${group.grades.length} ${group.grades.length === 1 ? "componente" : "componentes"}`}
                    defaultOpen={index === 0}
                  >
                    <GradeCards grades={group.grades} semester={group.semester} />
                    <GradeTable grades={group.grades} semester={group.semester} />
                  </GroupDisclosure>
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Nenhum resultado corresponde ao filtro selecionado.
              </p>
            )}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            O SIGAA não informou notas ou resultados neste snapshot.
          </p>
        )}
      </AcademicSection>

      <AcademicSection
        title="Componentes curriculares"
        summary={`${componentCounts.trajectory} na sua trajetória · ${componentCounts.pending} pendentes`}
        icon={<BookOpenCheck className="h-5 w-5" aria-hidden="true" />}
      >
        {(gradeQuery.isError || completedQuery.isError || enrolledQuery.isError) && (
          <div
            role="alert"
            className="mb-4 flex flex-wrap items-center gap-2 text-sm text-amber-700 dark:text-amber-300"
          >
            <p>
              Parte dos dados manuais não pôde ser combinada. Os dados do último snapshot SIGAA
              continuam visíveis.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                Promise.all([
                  gradeQuery.refetch(),
                  completedQuery.refetch(),
                  enrolledQuery.refetch(),
                ])
              }
            >
              Tentar novamente
            </Button>
          </div>
        )}
        <div className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <label
                htmlFor="academic-component-search"
                className="mb-1.5 block text-sm font-medium"
              >
                Buscar componente
              </label>
              <Input
                id="academic-component-search"
                type="search"
                value={componentSearch}
                placeholder="Código ou nome"
                onChange={event => setComponentSearch(event.target.value)}
              />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">O que mostrar</p>
              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-label="Escopo dos componentes"
              >
                {componentScopeOptions.map(([value, label, count]) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={componentScope === value ? "default" : "outline"}
                    aria-pressed={componentScope === value}
                    onClick={() => setComponentScope(value)}
                  >
                    {label}
                    <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          {componentGroups.length > 0 ? (
            <div className="space-y-2">
              {componentGroups.map(group => (
                <GroupDisclosure
                  key={group.key}
                  title={group.label}
                  summary={`${group.components.length} ${group.components.length === 1 ? "componente" : "componentes"}`}
                  defaultOpen={group.period === 1}
                  forceOpen={componentSearch.trim().length > 0}
                >
                  <ul className="divide-y border-t">
                    {group.components.map(component => (
                      <ComponentRow key={component.code} component={component} />
                    ))}
                  </ul>
                </GroupDisclosure>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Nenhum componente corresponde à busca e ao filtro selecionados.
            </p>
          )}
        </div>
      </AcademicSection>

      <SigaaIntegrationCredits />
      <SigaaConnectDialog
        open={connectOpen}
        requireConsent={connectAction.consentRequired}
        onOpenChange={setConnectOpen}
        onSynchronized={refreshAfterSync}
      />
    </main>
  );
}

export default function MeusDadosAcademicosPage() {
  return (
    <Suspense fallback={<AcademicPageSkeleton />}>
      <MeusDadosAcademicosPageContent />
    </Suspense>
  );
}
