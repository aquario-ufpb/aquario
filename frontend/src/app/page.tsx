"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { Github } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { entidadesService } from "@/lib/api/entidades";
import { Entidade } from "@/lib/types";

export default function Home() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch all entidades for preview (excluding EMPRESA)
  useEffect(() => {
    const fetchEntidades = async () => {
      try {
        const data = await entidadesService.getAll();
        // Filter out EMPRESA type entidades
        const filteredData = data.filter(entidade => entidade.tipo !== "EMPRESA");
        // Randomize the order using Fisher-Yates shuffle
        const shuffled = [...filteredData];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setEntidades(shuffled);
      } catch (error) {
        console.error("Error fetching entidades:", error);
      }
    };

    if (mounted) {
      fetchEntidades();
    }
  }, [mounted]);

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
      <main className="container mx-auto p-4 pt-8">
        {/* Hero Section */}
        <section className="text-center min-h-screen flex flex-col justify-center items-center">
          <div className="max-w-4xl mx-auto px-4">
            <div
              className={`font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6 whitespace-nowrap ${
                isDark ? "text-white" : "text-aquario-primary"
              }`}
            >
              <TextGenerateEffect
                words="Bem-vindo ao Aquário"
                className={`font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight whitespace-nowrap`}
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
            <div className="flex justify-center pointer-events-auto gap-2">
              <HoverBorderGradient
                containerClassName="rounded-full"
                className="px-10 py-4 text-lg font-semibold"
              >
                <Link href="/guias" className="block w-full text-center">
                  Comece com os Guias
                </Link>
              </HoverBorderGradient>
              <HoverBorderGradient
                containerClassName="rounded-full"
                className="px-10 py-4 text-lg font-semibold"
              >
                <Link href="/entidades" className="block w-full text-center">
                  Veja as Entidades
                </Link>
              </HoverBorderGradient>
              <HoverBorderGradient
                containerClassName="rounded-full"
                className="px-10 py-4 text-lg font-semibold"
              >
                <a
                  href="https://github.com/aquario-ufpb/aquario"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full"
                >
                  <Github className="w-6 h-6" />
                  Contribua
                </a>
              </HoverBorderGradient>
            </div>
          </div>
        </section>

        {/* Three Sections */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {/* Sobre Section */}
              <Link href="/sobre" className="block">
                <Card
                  className={`h-full hover:shadow-lg transition-shadow cursor-pointer pointer-events-auto ${
                    isDark
                      ? "bg-white/10 border-white/20 hover:bg-white/15"
                      : "bg-white/60 border-blue-200 hover:bg-white/80"
                  }`}
                >
                  <CardContent className="p-6">
                    <h3
                      className={`font-display text-xl font-bold mb-3 ${
                        isDark ? "text-white" : "text-aquario-primary"
                      }`}
                    >
                      Sobre o Projeto
                    </h3>
                    <p className={`text-sm mb-4 ${isDark ? "text-white/80" : "text-slate-700"}`}>
                      Conheça mais sobre o Aquário, nossa missão, visão e como contribuir para este
                      projeto em constante evolução.
                    </p>
                    <Button
                      variant="outline"
                      className={
                        isDark
                          ? "border-white text-white hover:bg-white/20"
                          : "border-blue-900 text-blue-900 hover:bg-blue-50"
                      }
                    >
                      Saiba Mais
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              {/* Guias Section */}
              <Link href="/guias" className="block">
                <Card
                  className={`h-full hover:shadow-lg transition-shadow cursor-pointer pointer-events-auto ${
                    isDark
                      ? "bg-white/10 border-white/20 hover:bg-white/15"
                      : "bg-white/60 border-blue-200 hover:bg-white/80"
                  }`}
                >
                  <CardContent className="p-6">
                    <h3
                      className={`font-display text-xl font-bold mb-3 ${
                        isDark ? "text-white" : "text-aquario-primary"
                      }`}
                    >
                      Guias e Recursos
                    </h3>
                    <p className={`text-sm mb-4 ${isDark ? "text-white/80" : "text-slate-700"}`}>
                      Encontre orientações, dicas e recursos que vão te ajudar em sua jornada
                      acadêmica no Centro de Informática.
                    </p>
                    <Button
                      variant="outline"
                      className={
                        isDark
                          ? "border-white text-white hover:bg-white/20"
                          : "border-blue-900 text-blue-900 hover:bg-blue-50"
                      }
                    >
                      Explorar Guias
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              {/* Entidades Section */}
              <div className="block">
                <Card
                  className={`h-full hover:shadow-lg transition-shadow pointer-events-auto ${
                    isDark
                      ? "bg-white/10 border-white/20 hover:bg-white/15"
                      : "bg-white/60 border-blue-200 hover:bg-white/80"
                  }`}
                >
                  <CardContent className="p-6">
                    <Link href="/entidades" className="block">
                      <h3
                        className={`font-display text-xl font-bold mb-3 ${
                          isDark ? "text-white" : "text-aquario-primary"
                        }`}
                      >
                        Entidades
                      </h3>
                      <p className={`text-sm mb-4 ${isDark ? "text-white/80" : "text-slate-700"}`}>
                        Procure laboratórios, ligas acadêmicas, grupos de pesquisa e outros do
                        Centro de Informática.
                      </p>
                      <Button
                        variant="outline"
                        className={
                          isDark
                            ? "border-white text-white hover:bg-white/20 mb-4"
                            : "border-blue-900 text-blue-900 hover:bg-blue-50 mb-4"
                        }
                      >
                        Ver Todas
                      </Button>
                    </Link>

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
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
    </BackgroundGradientAnimation>
  );
}
