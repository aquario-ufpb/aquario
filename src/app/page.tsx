"use client";
import { trackEvent } from "@/analytics/posthog-client";
import { FeatureCard } from "@/components/pages/landing/features/feature-card";
import { landingFeatures } from "@/components/pages/landing/features/feature-data";
import { WaterTransitionSection } from "@/components/pages/landing/water-transition-section";
import { Button } from "@/components/ui/button";
import { useEntidades } from "@/lib/client/hooks";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, GitBranch, Github, MapIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";

type LandingStats = {
  totalUsuarios: number;
  githubStars: number;
};

export default function Home() {
  const { data: entidades = [] } = useEntidades();
  const { data: landingStats } = useQuery({
    queryKey: ["landing-stats"],
    queryFn: async (): Promise<LandingStats> => {
      const response = await fetch("/api/landing-stats");

      if (!response.ok) {
        throw new Error("Failed to fetch landing stats");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const aboutStats = [
    {
      value: landingStats?.totalUsuarios.toLocaleString("pt-BR") ?? "...",
      label: "usuários cadastrados",
    },
    {
      value: landingStats?.githubStars.toLocaleString("pt-BR") ?? "75",
      label: "estrelas no GitHub",
    },
    { value: "Open source", label: "feito pela comunidade" },
  ];

  const groups = useMemo(
    () =>
      entidades.filter(
        entidade =>
          (entidade.tipo === "GRUPO" ||
            entidade.tipo === "LIGA_ACADEMICA" ||
            entidade.tipo === "OUTRO") &&
          entidade.imagePath
      ),
    [entidades]
  );

  const featuredLabs = useMemo(
    () =>
      entidades
        .filter(entidade => entidade.tipo === "LABORATORIO")
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [entidades]
  );

  useEffect(() => {
    // Log environment indicator
    if (process.env.NEXT_PUBLIC_IS_STAGING === "true") {
      console.log(
        "%c🎭 STAGING ENVIRONMENT",
        "background: #f59e0b; color: black; padding: 4px 8px; border-radius: 4px; font-weight: bold;"
      );
      console.log("This is the staging environment. Data may be reset at any time.");
    } else if (process.env.NODE_ENV === "production") {
      console.log(
        "%c🚀 PRODUCTION",
        "background: #22c55e; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;"
      );
    } else {
      console.log(
        "%c🛠️ DEVELOPMENT",
        "background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;"
      );
    }
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="container relative z-20 mx-auto px-4 pt-20 md:pt-8">
        {/* Hero Section */}
        <section className="flex min-h-[82vh] flex-col items-center justify-center text-center">
          <div className="mx-auto w-full max-w-4xl px-4">
            <h1 className="mb-6 font-display text-5xl font-bold leading-tight tracking-tight text-aquario-primary dark:text-white md:text-6xl lg:text-7xl">
              Tudo que o estudante do CI precisa, em um só lugar.
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-700 dark:text-slate-300 md:text-xl">
              Encontre salas, organize disciplinas, explore guias, acompanhe datas acadêmicas e
              descubra entidades do Centro de Informática.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 md:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 w-full rounded-full bg-aquario-primary px-8 text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-aquario-primary/90 md:w-auto"
              >
                <Link href="/recursos">Explorar recursos</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-full border-slate-300 bg-white px-8 text-base font-semibold text-slate-900 hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 md:w-auto"
              >
                <Link href="/mapas">
                  <MapIcon className="mr-2 h-5 w-5" />
                  Ver mapa do CI
                </Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-400 sm:flex-row">
              <Link
                href="/grades-curriculares"
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-slate-200/70 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <GitBranch className="h-4 w-4" />
                Grade curricular
              </Link>
              <a
                href="https://github.com/aquario-ufpb/aquario"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-slate-200/70 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"
                onClick={() => trackEvent("github_button_clicked", { location: "landing_hero" })}
              >
                <Github className="h-4 w-4" />
                Contribuir no GitHub
              </a>
            </div>
          </div>
        </section>
      </div>

      <WaterTransitionSection>
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 grid gap-6 md:grid-cols-[1fr_0.75fr] md:items-end">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-sky-200">
                Recursos
              </p>
              <h2 className="font-display text-4xl font-bold leading-tight text-white md:text-5xl">
                Tudo que você precisa, em um só lugar.
              </h2>
            </div>
            <p className="max-w-xl text-base font-medium leading-relaxed text-sky-100 md:text-lg">
              Recursos simples para organizar sua vida acadêmica, encontrar oportunidades e fazer
              parte da comunidade do CI.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {landingFeatures.map(feature => (
              <FeatureCard key={feature.title} {...feature} groups={groups} labs={featuredLabs} />
            ))}
          </div>

          <section className="pt-20 md:pt-28">
            <div className="grid gap-8 rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-sm backdrop-blur-sm md:grid-cols-[0.85fr_1.15fr] md:items-center md:p-10">
              <div>
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-sky-200">
                  Sobre
                </p>
                <h2 className="font-display text-4xl font-bold leading-tight text-white md:text-5xl">
                  Um ponto de encontro para a comunidade do CI.
                </h2>
              </div>
              <div className="space-y-6">
                <p className="text-base font-medium leading-relaxed text-sky-100 md:text-lg">
                  O Aquário centraliza informações acadêmicas, mapas, guias, entidades e
                  oportunidades para deixar a vida no Centro de Informática mais simples e
                  conectada.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {aboutStats.map(stat => (
                    <div key={stat.label} className="rounded-2xl bg-white/[0.06] p-4">
                      <p className="font-display text-3xl font-bold text-white">{stat.value}</p>
                      <p className="mt-1 text-sm leading-snug text-sky-100">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/sobre">
                    Conhecer o projeto
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </WaterTransitionSection>

      <footer className="relative -mt-px overflow-hidden bg-sky-800 pt-16 text-blue-50 dark:bg-sky-950 md:pt-24">
        <svg
          aria-hidden="true"
          viewBox="0 0 1200 320"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full text-blue-950 dark:text-slate-900"
        >
          <title>Silhueta decorativa do fundo do oceano</title>
          <path
            d="M0 64C92 46 188 50 290 70C414 94 516 58 640 68C766 78 852 118 980 94C1084 75 1152 54 1200 42V320H0V64Z"
            fill="currentColor"
          />
        </svg>
        <div className="container relative mx-auto px-4 py-10">
          <div className="mx-auto flex max-w-4xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-display text-2xl font-bold text-white">Aquário</p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-blue-200">
                Feito por estudantes, para estudantes do Centro de Informática da UFPB.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/sobre"
                className="rounded-full px-3 py-2 transition-colors hover:bg-white/10 hover:text-white"
              >
                Sobre
              </Link>
              <Link
                href="/guias"
                className="rounded-full px-3 py-2 transition-colors hover:bg-white/10 hover:text-white"
              >
                Guias
              </Link>
              <Link
                href="/entidades"
                className="rounded-full px-3 py-2 transition-colors hover:bg-white/10 hover:text-white"
              >
                Entidades
              </Link>
              <a
                href="https://github.com/aquario-ufpb/aquario"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-white/10 hover:text-white"
                onClick={() => trackEvent("github_button_clicked", { location: "landing_footer" })}
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
