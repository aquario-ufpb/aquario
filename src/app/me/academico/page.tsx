"use client";

import Link from "next/link";
import { ArrowLeft, BookOpenCheck, GraduationCap } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnSigaaAcademicState } from "@/lib/client/hooks/use-sigaa";
import { useRequireAuth } from "@/lib/client/hooks/use-require-auth";
import { useCurrentUser } from "@/lib/client/hooks/use-usuarios";
import { useGradeCurricular } from "@/lib/client/hooks/use-grade-curricular";
import { useDisciplinasConcluidas } from "@/lib/client/hooks/use-disciplinas-concluidas";
import { useDisciplinasSemestreAtivo } from "@/lib/client/hooks/use-disciplinas-semestre";
import {
  collectManualAcademicComponents,
  combineAcademicDisplay,
} from "@/lib/shared/sigaa/combine-academic-display";

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

export default function MeusDadosAcademicosPage() {
  useRequireAuth();
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
      completedDisciplineIds: completedQuery.data?.disciplinaIds ?? [],
      enrolled:
        enrolledQuery.data?.disciplinas.map(item => ({
          disciplinaId: item.disciplinaId,
          code: item.disciplinaCodigo,
        })) ?? [],
    });

    return combineAcademicDisplay({
      catalog,
      manual,
      sigaa: stateQuery.data?.snapshot?.payload.curriculum.components ?? [],
    });
  }, [completedQuery.data, enrolledQuery.data, gradeQuery.data, stateQuery.data]);

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
  if (stateQuery.isError || !snapshot) {
    return (
      <main className="container mx-auto max-w-3xl px-6 pb-24 pt-32 text-center">
        <h1 className="text-2xl font-semibold">Meus dados acadêmicos</h1>
        <p className="mt-3 text-muted-foreground">
          {stateQuery.isError
            ? "Não foi possível carregar os dados importados."
            : "Você ainda não sincronizou um snapshot acadêmico."}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/perfil">Voltar ao perfil</Link>
        </Button>
      </main>
    );
  }

  const { payload } = snapshot;

  return (
    <main className="container mx-auto max-w-5xl space-y-8 px-6 pb-24 pt-32">
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
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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
                    <span>{item.completedPercent}%</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.completedHours}h concluídas de {item.totalHours}h
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
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
          <p role="alert" className="mb-3 text-sm text-amber-700 dark:text-amber-300">
            Parte dos dados manuais não pôde ser combinada. Os dados do último snapshot SIGAA
            continuam visíveis.
          </p>
        )}
        <div className="space-y-2">
          {academicDisplay.map(component => (
            <div
              key={component.code}
              className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{component.presentation.name}</p>
                <p className="text-sm text-muted-foreground">
                  {component.code}
                  {component.sigaa ? ` · ${component.sigaa.workloadHours}h` : ""}
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
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{stateLabels[component.presentation.state]}</Badge>
                <Badge variant="secondary">
                  {component.presentation.origin === "CATALOG"
                    ? "Catálogo"
                    : component.presentation.origin === "MANUAL"
                      ? "Manual"
                      : "SIGAA"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </section>

      {payload.classes.length > 0 && (
        <section aria-labelledby="academic-classes-heading">
          <h2 id="academic-classes-heading" className="mb-4 text-xl font-semibold">
            Turmas atuais
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {payload.classes.map(item => (
              <Card key={item.sourceKey}>
                <CardContent className="space-y-1 pt-6">
                  <p className="font-medium">{item.name}</p>
                  {item.scheduleRaw && (
                    <p className="text-sm text-muted-foreground">{item.scheduleRaw}</p>
                  )}
                  {item.room && <p className="text-sm text-muted-foreground">Sala {item.room}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

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
    </main>
  );
}
