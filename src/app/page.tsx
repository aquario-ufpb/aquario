"use client";
import { trackEvent } from "@/analytics/posthog-client";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { useEntidades } from "@/lib/client/hooks";
import { PAGE_HEADER_TEXT } from "@/lib/shared/constants/page-header-text";
import { GitBranch, Github, Map } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FeatureSection } from "../../components/ui/feature-section";

export default function Home() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use React Query hook
  const { data: allEntidades = [] } = useEntidades();

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

  // Filter and shuffle entidades for preview (excluding EMPRESA)
  const entidades = useMemo(() => {
    if (!mounted || allEntidades.length === 0) {
      return [];
    }
    // Filter out EMPRESA type entidades
    const filteredData = allEntidades.filter(entidade => entidade.tipo !== "EMPRESA");
    // Randomize the order using Fisher-Yates shuffle
    const shuffled = [...filteredData];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [mounted, allEntidades]);

  // Auto-scroll functionality
  useEffect(() => {
    if (!scrollContainerRef.current || entidades.length === 0 || isScrolling) {
      return;
    }

    const container = scrollContainerRef.current;
    const scrollSpeed = 1.5; // pixels per frame - faster scrolling
    let animationFrameId: number;

    const autoScroll = () => {
      if (!isScrolling) {
        container.scrollLeft += scrollSpeed;
        // Reset scroll position when we reach halfway (for infinite effect)
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [entidades.length, isScrolling]);

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
              >
                {/* Entidades Infinite Scroll Preview */}
                {entidades.length > 0 && (
                  <div
                    ref={scrollContainerRef}
                    className="mt-4 relative overflow-x-auto overflow-y-hidden scrollbar-hide"
                    onWheel={() => {
                      setIsScrolling(true);
                      setTimeout(() => setIsScrolling(false), 2000);
                    }}
                    onMouseDown={() => setIsScrolling(true)}
                    onMouseUp={() => setTimeout(() => setIsScrolling(false), 1000)}
                    onTouchStart={() => setIsScrolling(true)}
                    onTouchEnd={() => setTimeout(() => setIsScrolling(false), 1000)}
                  >
                    <style>
                      {`
                          .scrollbar-hide::-webkit-scrollbar {
                            display: none;
                          }
                          .scrollbar-hide {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                          }
                        `}
                    </style>
                    <div className="flex gap-4" style={{ width: "fit-content" }}>
                      {/* Duplicate entidades for seamless loop */}
                      {[...entidades, ...entidades].map((entidade, index) => (
                        <Link
                          key={`${entidade.id}-${index}`}
                          href={`/entidade/${entidade.slug}`}
                          className={`flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 pointer-events-auto border min-w-[200px] max-w-[250px] ${
                            isDark ? "border-white/10" : "border-black/10"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={entidade.imagePath || ""}
                            alt={entidade.name}
                            className="w-12 h-12 object-contain rounded flex-shrink-0"
                            onError={e => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                isDark ? "text-white" : "text-slate-900"
                              }`}
                            >
                              {entidade.name}
                            </p>
                            {entidade.subtitle && (
                              <p
                                className={`text-xs truncate ${
                                  isDark ? "text-white/60" : "text-slate-600"
                                }`}
                              >
                                {entidade.subtitle}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </FeatureSection>
            </div>
          </div>
        </section>
      </main>
    </BackgroundGradientAnimation>
  );
}
