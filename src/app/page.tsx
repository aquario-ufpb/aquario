"use client";
import { trackEvent } from "@/analytics/posthog-client";
import { PAGE_HEADER_TEXT } from "@/lib/shared/constants/page-header-text";
import { Button } from "@/components/ui/button";
import { GitBranch, Github, MapIcon } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EntidadesCarousel } from "@/components/pages/landing/entidades-carousel";
import { FeatureSection } from "@/components/pages/landing/feature-section";
import { WaterTransitionSection } from "@/components/pages/landing/water-transition-section";

export default function Home() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);

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

  const isDark = (resolvedTheme || theme) === "dark";

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="container relative z-20 mx-auto px-4 pt-24">
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
                <Link href="/ferramentas">Explorar ferramentas</Link>
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
                onClick={() => trackEvent("github_button_clicked")}
              >
                <Github className="h-4 w-4" />
                Contribuir no GitHub
              </a>
            </div>
          </div>
        </section>
      </div>

      <WaterTransitionSection>
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
              Ferramentas para atravessar o semestre
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sky-100">
              Um ponto de partida limpo para navegar pelo CI, planejar disciplinas e se conectar com
              a comunidade acadêmica.
            </p>
          </div>
          <div className="space-y-6">
            {/* Tools Section - Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mapas Section */}
              <FeatureSection
                title={PAGE_HEADER_TEXT.mapas.title}
                subtitle={PAGE_HEADER_TEXT.mapas.extendedSubtitle}
                buttonText="Ver Mapas"
                buttonUrl="/mapas"
                imageSrc={isDark ? "/mapas/dark.png" : "/mapas/light.png"}
                imageAlt="Mapas"
                isDark={isDark}
              />

              {/* Calendario Section */}
              <FeatureSection
                title={PAGE_HEADER_TEXT.minhasDisciplinas.title}
                subtitle={PAGE_HEADER_TEXT.minhasDisciplinas.extendedSubtitle}
                buttonText="Minhas Disciplinas"
                buttonUrl="/calendario"
                imageSrc={isDark ? "/calendario/dark.png" : "/calendario/light.png"}
                imageAlt="Calendário"
                isDark={isDark}
              />
            </div>

            {/* Calendario Academico Section */}
            <FeatureSection
              title={PAGE_HEADER_TEXT.calendarioAcademico.title}
              subtitle={PAGE_HEADER_TEXT.calendarioAcademico.extendedSubtitle}
              buttonText="Ver Calendário"
              buttonUrl="/calendario-academico"
              imageSrc={
                isDark ? "/calendario-academico/dark.png" : "/calendario-academico/light.png"
              }
              imageAlt="Calendário Acadêmico"
              isDark={isDark}
              badgeText="Novo"
              badgeClassName={
                isDark
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-green-500/10 text-green-600 border-green-500/30"
              }
            />

            {/* Grades Curriculares Section */}
            <FeatureSection
              title={PAGE_HEADER_TEXT.gradesCurriculares.title}
              subtitle={PAGE_HEADER_TEXT.gradesCurriculares.extendedSubtitle}
              buttonText="Ver Grade"
              buttonUrl="/grades-curriculares"
              imageSrc={isDark ? "/grade/dark.png" : "/grade/light.png"}
              imageAlt="Grades Curriculares"
              isDark={isDark}
              badgeText="Novo"
              badgeClassName={
                isDark
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-green-500/10 text-green-600 border-green-500/30"
              }
            />

            {/* Guias Section */}
            <FeatureSection
              title={PAGE_HEADER_TEXT.guias.title}
              subtitle={PAGE_HEADER_TEXT.guias.extendedSubtitle}
              buttonText="Explorar Guias"
              buttonUrl="/guias"
              imageSrc={isDark ? "/guias/dark.png" : "/guias/light.png"}
              imageAlt="Guias"
              isDark={isDark}
            />

            {/* Sobre Section */}
            <FeatureSection
              title={PAGE_HEADER_TEXT.sobre.title}
              subtitle={PAGE_HEADER_TEXT.sobre.extendedSubtitle}
              buttonText="Saiba Mais"
              buttonUrl="/sobre"
              isDark={isDark}
            />

            {/* Entidades Section */}
            <FeatureSection
              title={PAGE_HEADER_TEXT.entidades.title}
              subtitle={PAGE_HEADER_TEXT.entidades.extendedSubtitle}
              buttonText="Ver Todas"
              buttonUrl="/entidades"
              isDark={isDark}
              carousel={<EntidadesCarousel isDark={isDark} />}
            />
          </div>
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
                onClick={() => trackEvent("github_button_clicked")}
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
