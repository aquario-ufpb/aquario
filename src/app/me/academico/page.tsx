"use client";

import Link from "next/link";
import { ArrowLeft, BookOpenCheck, GraduationCap, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { trackEvent } from "@/analytics/posthog-client";
import type { SigaaConnectionState } from "@/analytics/posthog-events";
import { SigaaConnectDialog } from "@/components/pages/perfil/sigaa-connect-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SIGAA_CONSENT_VERSION } from "@/lib/client/api/sigaa";
import { useOwnSigaaAcademicState } from "@/lib/client/hooks/use-sigaa";
import { useRequireAuth } from "@/lib/client/hooks/use-require-auth";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { useGradeCurricular } from "@/lib/client/hooks/use-grade-curricular";
import { useDisciplinasConcluidas } from "@/lib/client/hooks/use-disciplinas-concluidas";
import { useDisciplinasSemestreAtivo } from "@/lib/client/hooks/use-disciplinas-semestre";
import { queryKeys } from "@/lib/client/query-keys";
import { toSigaaIntegrationView } from "@/lib/client/sigaa/view-model";
import {
  collectManualAcademicComponents,
  combineAcademicDisplay,
} from "@/lib/shared/sigaa/combine-academic-display";
import type { SigaaAcademicSnapshotPayload } from "@/lib/shared/types/sigaa-academic";

const stateLabels = {
  completed: "Concluída",
  enrolled: "Cursando",
  pending: "Pendente",
  unknown: "Estado desconhecido",
} as const;

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(
    new Date(value)
  );

const percentFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
type ComponentFilter = "all" | "completed" | "enrolled" | "pending" | "unknown";

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

export default function MeusDadosAcademicosPage() {
  useRequireAuth();
  const queryClient = useQueryClient();
  const [connectOpen, setConnectOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ComponentFilter>("all");
  const [visibleCount, setVisibleCount] = useState(30);
  const currentUser = useCurrentUser();
  const hasBeta = currentUser.data?.permissoes.includes("sigaa:beta") ?? false;
  const stateQuery = useOwnSigaaAcademicState(hasBeta);
  const gradeQuery = useGradeCurricular(hasBeta ? (currentUser.data?.curso.id ?? null) : null);
  const completedQuery = useDisciplinasConcluidas(hasBeta);
  const enrolledQuery = useDisciplinasSemestreAtivo(hasBeta);

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

  const openConnectDialog = () => {
    trackEvent("sigaa_connect_opened", {
      operation: connectAction.operation,
      consent_required: connectAction.consentRequired,
    });
    if (connectAction.operation === "sync") {
      trackEvent("sigaa_sync_again_clicked", {
        connection_state: connectAction.connectionState,
      });
    }
    setConnectOpen(true);
  };
  useEffect(() => {
    if (integrationKind) {
      trackEvent("sigaa_academic_page_opened", { connection_state: integrationKind });
    }
  }, [integrationKind]);

  const filteredComponents = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return academicDisplay.filter(component => {
      const matchesFilter = filter === "all" || component.presentation.state === filter;
      const matchesSearch =
        !normalizedSearch ||
        component.code.toLocaleLowerCase("pt-BR").includes(normalizedSearch) ||
        component.presentation.name.toLocaleLowerCase("pt-BR").includes(normalizedSearch);
      return matchesFilter && matchesSearch;
    });
  }, [academicDisplay, filter, search]);

  const componentGroups = useMemo(() => {
    const groups = new Map<string, typeof filteredComponents>();
    filteredComponents.slice(0, visibleCount).forEach(component => {
      const period = component.sigaa?.period;
      const key = period !== null && period !== undefined ? `${period}º período` : "Sem período";
      groups.set(key, [...(groups.get(key) ?? []), component]);
    });
    return [...groups.entries()];
  }, [filteredComponents, visibleCount]);

  const gradeGroups = useMemo(() => {
    const groups = new Map<string, SigaaAcademicSnapshotPayload["grades"]>();
    stateQuery.data?.snapshot?.payload.grades.forEach(item => {
      groups.set(item.semester, [...(groups.get(item.semester) ?? []), item]);
    });
    return [...groups.entries()];
  }, [stateQuery.data]);

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
    (hasBeta &&
      (stateQuery.isLoading ||
        gradeQuery.isLoading ||
        completedQuery.isLoading ||
        enrolledQuery.isLoading))
  ) {
    return (
      <main className="container mx-auto max-w-5xl space-y-6 px-6 pb-24 pt-32">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-80 w-full" />
      </main>
    );
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

  if (!hasBeta) {
    return (
      <main className="container mx-auto max-w-3xl px-6 pb-24 pt-32 text-center">
        <h1 className="text-2xl font-semibold">Integração SIGAA indisponível</h1>
        <p className="mt-3 text-muted-foreground">Esta funcionalidade está em beta restrita.</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/perfil">Voltar ao perfil</Link>
        </Button>
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

  return (
    <main
      className="ph-no-capture container mx-auto max-w-5xl space-y-8 px-6 pb-24 pt-32"
      data-ph-no-capture="true"
    >
      <div>
        <Button asChild variant="ghost" className="mb-4 -ml-3">
          <Link href="/perfil">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Voltar ao perfil
          </Link>
        </Button>
        <div className="flex items-start gap-3">
          <GraduationCap className="mt-1 h-7 w-7 text-sky-700" aria-hidden="true" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meus dados acadêmicos</h1>
            <p className="mt-1 text-muted-foreground">
              Snapshot privado sincronizado em {formatDateTime(snapshot.synchronizedAt)}.
            </p>
          </div>
        </div>
        <Button className="mt-4" variant="outline" onClick={openConnectDialog}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Sincronizar novamente
        </Button>
      </div>

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">CRA</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {payload.curriculum.cra.value ?? "Indisponível"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Matrícula</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{payload.identity.matricula}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Currículo</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{payload.curriculum.code}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Período no SIGAA</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {payload.identity.sourceSemester ?? "Indisponível"}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do currículo no SIGAA</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="font-medium">Curso informado:</span>{" "}
            {payload.identity.sourceCourse ?? "Indisponível"}
          </p>
          <p>
            <span className="font-medium">Prazo máximo:</span>{" "}
            {payload.curriculum.maximumCompletionTerm ?? "Indisponível"}
          </p>
          <p>
            <span className="font-medium">Carga semestral mínima:</span>{" "}
            {payload.curriculum.semesterWorkload.minimum === null
              ? "Indisponível"
              : `${payload.curriculum.semesterWorkload.minimum}h`}
          </p>
          <p>
            <span className="font-medium">Carga semestral máxima:</span>{" "}
            {payload.curriculum.semesterWorkload.maximum === null
              ? "Indisponível"
              : `${payload.curriculum.semesterWorkload.maximum}h`}
          </p>
        </CardContent>
      </Card>

      {payload.curriculum.progress.length > 0 && (
        <section aria-labelledby="academic-progress-heading">
          <h2 id="academic-progress-heading" className="mb-4 text-xl font-semibold">
            Progresso
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {payload.curriculum.progress.map(item => (
              <Card key={item.description}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium">{item.description}</span>
                    <span>{percentFormatter.format(item.completedPercent)}%</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.completedHours}h concluídas de {item.totalHours}h
                    {` · ${item.remainingHours}h restantes`}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {payload.curriculum.progress.length === 0 && (
        <section aria-labelledby="academic-progress-heading-empty">
          <h2 id="academic-progress-heading-empty" className="mb-2 text-xl font-semibold">
            Progresso
          </h2>
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            O SIGAA não informou o progresso do currículo neste snapshot.
          </p>
        </section>
      )}

      <section aria-labelledby="academic-components-heading">
        <div className="mb-4 flex items-center gap-2">
          <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
          <h2 id="academic-components-heading" className="text-xl font-semibold">
            Componentes curriculares
          </h2>
        </div>
        {(gradeQuery.isError || completedQuery.isError || enrolledQuery.isError) && (
          <div
            role="alert"
            className="mb-3 flex flex-wrap items-center gap-2 text-sm text-amber-700 dark:text-amber-300"
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
        <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <label htmlFor="academic-component-search" className="mb-1 block text-sm font-medium">
              Buscar componente
            </label>
            <Input
              id="academic-component-search"
              type="search"
              value={search}
              placeholder="Código ou nome"
              onChange={event => {
                setSearch(event.target.value);
                setVisibleCount(30);
              }}
            />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">Filtrar por situação</p>
            <div className="flex flex-wrap gap-1" role="group" aria-label="Situação do componente">
              {(
                [
                  ["all", "Todos"],
                  ["completed", "Concluídos"],
                  ["enrolled", "Cursando"],
                  ["pending", "Pendentes"],
                  ["unknown", "Desconhecidos"],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={filter === value ? "default" : "outline"}
                  aria-pressed={filter === value}
                  onClick={() => {
                    setFilter(value);
                    setVisibleCount(30);
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        {componentGroups.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Nenhum componente corresponde à busca e ao filtro selecionados.
          </p>
        ) : (
          componentGroups.map(([group, components]) => (
            <div key={group} className="mb-6 space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">{group}</h3>
              {components.map(component => (
                <div
                  key={component.code}
                  className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{component.presentation.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {component.code}
                      {component.sigaa ? ` · ${component.sigaa.workloadHours}h` : ""}
                      {component.sigaa ? ` · ${component.sigaa.integrationType}` : ""}
                      {component.sigaa?.period !== null && component.sigaa?.period !== undefined
                        ? ` · ${component.sigaa.period}º período`
                        : ""}
                    </p>
                    {component.sigaa &&
                      component.manual &&
                      component.sigaa.status !== component.manual.state && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Valor manual preservado: {stateLabels[component.manual.state]}.
                        </p>
                      )}
                    {component.sigaa &&
                      (component.sigaa.prerequisite || component.sigaa.corequisite) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {component.sigaa.prerequisite
                            ? `Pré-requisito: ${component.sigaa.prerequisite}`
                            : ""}
                          {component.sigaa.prerequisite && component.sigaa.corequisite ? " · " : ""}
                          {component.sigaa.corequisite
                            ? `Correquisito: ${component.sigaa.corequisite}`
                            : ""}
                        </p>
                      )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{stateLabels[component.presentation.state]}</Badge>
                    <Badge variant="secondary">
                      {component.presentation.origin === "CATALOG"
                        ? "Catálogo"
                        : component.presentation.origin === "MANUAL"
                          ? "Manual"
                          : "SIGAA"}
                    </Badge>
                    {component.sigaa && (
                      <Badge variant="outline">
                        {component.sigaa.required ? "Obrigatória" : "Optativa"}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        {visibleCount < filteredComponents.length && (
          <Button variant="outline" onClick={() => setVisibleCount(count => count + 30)}>
            Mostrar mais {Math.min(30, filteredComponents.length - visibleCount)}
          </Button>
        )}
      </section>

      <section aria-labelledby="academic-grades-heading">
        <h2 id="academic-grades-heading" className="mb-4 text-xl font-semibold">
          Notas, resultados e faltas
        </h2>
        {gradeGroups.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            O SIGAA não informou notas ou resultados neste snapshot.
          </p>
        ) : (
          gradeGroups.map(([semester, grades]) => (
            <div key={semester} className="mb-6">
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{semester}</h3>
              <div
                className="space-y-3 sm:hidden"
                role="list"
                aria-label={`Notas do semestre ${semester}`}
              >
                {grades.map(item => (
                  <Card key={`${semester}-${item.code}`} role="listitem">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{item.discipline}</CardTitle>
                      <p className="text-xs text-muted-foreground">{item.code}</p>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                        <div>
                          <dt className="text-muted-foreground">Notas</dt>
                          <dd className="font-medium">
                            {item.units.length ? item.units.join(" · ") : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Exame</dt>
                          <dd className="font-medium">{item.exam ?? "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Resultado</dt>
                          <dd className="font-medium">{item.result ?? "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Faltas</dt>
                          <dd className="font-medium">{item.absences ?? "—"}</dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-muted-foreground">Situação</dt>
                          <dd className="font-medium">{item.status ?? "—"}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="hidden overflow-x-auto rounded-lg border sm:block">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <caption className="sr-only">Notas do semestre {semester}</caption>
                  <thead className="bg-muted/50">
                    <tr>
                      <th scope="col" className="p-3">
                        Componente
                      </th>
                      <th scope="col" className="p-3">
                        Notas
                      </th>
                      <th scope="col" className="p-3">
                        Exame
                      </th>
                      <th scope="col" className="p-3">
                        Resultado
                      </th>
                      <th scope="col" className="p-3">
                        Faltas
                      </th>
                      <th scope="col" className="p-3">
                        Situação
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map(item => (
                      <tr key={`${semester}-${item.code}`} className="border-t">
                        <td className="p-3">
                          <span className="font-medium">{item.discipline}</span>
                          <br />
                          <span className="text-xs text-muted-foreground">{item.code}</span>
                        </td>
                        <td className="p-3">{item.units.length ? item.units.join(" · ") : "—"}</td>
                        <td className="p-3">{item.exam ?? "—"}</td>
                        <td className="p-3">{item.result ?? "—"}</td>
                        <td className="p-3">{item.absences ?? "—"}</td>
                        <td className="p-3">{item.status ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </section>

      <section aria-labelledby="academic-classes-heading">
        <h2 id="academic-classes-heading" className="mb-4 text-xl font-semibold">
          Turmas atuais
        </h2>
        {payload.classes.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {payload.classes.map(item => (
              <Card key={item.sourceKey}>
                <CardContent className="space-y-1 pt-6">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[item.code, item.semester].filter(Boolean).join(" · ")}
                  </p>
                  {item.scheduleRaw && (
                    <p className="text-sm text-muted-foreground">{item.scheduleRaw}</p>
                  )}
                  {item.room && <p className="text-sm text-muted-foreground">Sala {item.room}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            O SIGAA não informou turmas atuais neste snapshot.
          </p>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Fonte de integração:{" "}
        <a
          href="https://github.com/PucaVaz/sigaa-for-ai-agents"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          sigaa-for-ai-agents, de PucaVaz
        </a>
        .
      </p>
      <SigaaConnectDialog
        open={connectOpen}
        requireConsent={connectAction.consentRequired}
        onOpenChange={setConnectOpen}
        onSynchronized={refreshAfterSync}
      />
    </main>
  );
}
