"use client";
import { trackEvent } from "@/analytics/posthog-client";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { PAGE_HEADER_TEXT } from "@/lib/shared/constants/page-header-text";
import { GitBranch, Github, Map } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EntidadesCarousel } from "@/components/pages/landing/entidades-carousel";
import { FeatureSection } from "@/components/pages/landing/feature-section";

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

  // Dark mode colors - fundo escuro com bolas azuis claras (15% mais claras)
  const darkColors = {
    gradientStart: "rgb(3, 7, 18)",
    gradientEnd: "rgb(48, 101, 131)", // rgb(12, 74, 110) clareado em 15%
    firstColor: "96, 159, 192", // rgb(69, 143, 181) clareado em 15%
    secondColor: "99, 134, 190", // rgb(72, 113, 179) clareado em 15%
    thirdColor: "147, 188, 230", // rgb(128, 177, 226) clareado em 15%
    fourthColor: "214, 242, 255", // rgb(207, 240, 255) clareado em 15%
    fifthColor: "96, 159, 192", // rgb(69, 143, 181) clareado em 15%
    pointerColor: "147, 188, 230", // rgb(128, 177, 226) clareado em 15%
  };

  // Light mode colors - fundo branco com bolas azuis (15% mais claras)
  const lightColors = {
    gradientStart: "rgb(250, 250, 250)",
    gradientEnd: "rgb(255, 255, 255)",
    firstColor: "48, 101, 131", // rgb(12, 74, 110) clareado em 15%
    secondColor: "96, 159, 192", // rgb(69, 143, 181) clareado em 15%
    thirdColor: "99, 134, 190", // rgb(72, 113, 179) clareado em 15%
    fourthColor: "147, 188, 230", // rgb(128, 177, 226) clareado em 15%
    fifthColor: "96, 159, 192", // rgb(69, 143, 181) clareado em 15%
    pointerColor: "99, 134, 190", // rgb(72, 113, 179) clareado em 15%
  };

  const colors = isDark ? darkColors : lightColors;

  if (!mounted) {
    return null;
  }

  return (
    <BackgroundGradientAnimation
      gradientBackgroundStart={colors.gradientStart}
      gradientBackgroundEnd={colors.gradientEnd}
      firstColor={colors.firstColor}
      secondColor={colors.secondColor}
      thirdColor={colors.thirdColor}
      fourthColor={colors.fourthColor}
      fifthColor={colors.fifthColor}
      pointerColor={colors.pointerColor}
    >
      <main className="container mx-auto p-4 pt-8 overflow-x-hidden">
        {/* Hero Section */}
        <section className="text-center min-h-screen flex flex-col justify-center items-center">
          <div className="max-w-4xl mx-auto px-4 w-full">
            <div
              className={`font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6 ${
                isDark ? "text-white" : "text-aquario-primary"
              }`}
            >
              <TextGenerateEffect
                words="Bem-vindo ao Aquário"
                className={`font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight md:whitespace-nowrap`}
                filter={true}
                duration={0.8}
              />
            </div>
            <p
              className={`text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto mb-12 leading-relaxed ${
                isDark ? "text-white/90" : "text-slate-700"
              }`}
            >
              Seu hub de oportunidades, projetos e conexões
              <br />
              no Centro de Informática da UFPB.
            </p>
            <div className="flex flex-col md:flex-row justify-center items-center pointer-events-auto gap-2 md:gap-2">
              <Link href="/grades-curriculares" className="w-full md:w-auto">
                <HoverBorderGradient
                  containerClassName="rounded-full w-full md:w-auto"
                  className="px-10 py-4 text-lg font-semibold"
                >
                  <div className="flex items-center justify-center gap-2 w-full">
                    <GitBranch className="w-5 h-5" />
                    Explore a Grade Curricular
                  </div>
                </HoverBorderGradient>
              </Link>
              <Link href="/mapas" className="w-full md:w-auto">
                <HoverBorderGradient
                  containerClassName="rounded-full w-full md:w-auto"
                  className="px-10 py-4 text-lg font-semibold"
                >
                  <div className="flex items-center justify-center gap-2 w-full">
                    <Map className="w-5 h-5" />
                    Explore o Mapa
                  </div>
                </HoverBorderGradient>
              </Link>
              <a
                href="https://github.com/aquario-ufpb/aquario"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto"
                onClick={() => trackEvent("github_button_clicked")}
              >
                <HoverBorderGradient
                  containerClassName="rounded-full w-full md:w-auto"
                  className="px-10 py-4 text-lg font-semibold"
                >
                  <div className="flex items-center justify-center gap-2 w-full">
                    <Github className="w-6 h-6" />
                    Contribua
                  </div>
                </HoverBorderGradient>
              </a>
            </div>
          </div>
        </section>

        {/* Three Sections */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto">
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
        </section>
      </main>
    </BackgroundGradientAnimation>
  );
}
