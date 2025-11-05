"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Home() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
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
      <main className="container mx-auto p-4 pt-12">
        {/* Hero Section */}
        <section className="text-center min-h-screen flex flex-col justify-center items-center">
          <div className="max-w-4xl mx-auto px-4">
            <div className={`font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6 whitespace-nowrap ${
              isDark ? "text-white" : "text-aquario-primary"
            }`}>
              <TextGenerateEffect
                words="Bem-vindo ao Aquário"
                className={`font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight whitespace-nowrap`}
                filter={true}
                duration={0.8}
              />
            </div>
            <p className={`text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto mb-12 leading-relaxed ${
              isDark ? "text-white/90" : "text-slate-700"
            }`}>
              Seu hub de oportunidades, projetos e conexões<br />
              no Centro de Informática da UFPB.
            </p>
            <div className="flex justify-center pointer-events-auto">
              <HoverBorderGradient
                containerClassName="rounded-full"
                className="px-10 py-4 text-lg font-semibold"
              >
                <Link href="/guias" className="block w-full text-center">
                  Começar com os Guias
                </Link>
              </HoverBorderGradient>
            </div>
          </div>
        </section>

        {/* Project Status Section */}
        <section className="text-center py-10">
          <div className="max-w-3xl mx-auto">
            <h2 className={`font-display text-3xl font-bold tracking-wide mb-6 drop-shadow-lg ${
              isDark ? "text-white" : "text-aquario-primary"
            }`}>
              Projeto em Desenvolvimento
            </h2>
            <p className={`text-lg mb-8 drop-shadow-md ${
              isDark ? "text-white/80" : "text-slate-700"
            }`}>
              O Aquário é um projeto em constante evolução. Em breve, teremos mais páginas e
              funcionalidades disponíveis.
            </p>
            <div className={`backdrop-blur-md rounded-lg p-8 pointer-events-auto ${
              isDark 
                ? "bg-white/10 border border-white/20" 
                : "bg-white/60 border border-blue-200"
            }`}>
              <h3 className={`font-display text-2xl font-bold tracking-wide mb-4 ${
                isDark ? "text-white" : "text-aquario-primary"
              }`}>
                Para Estudantes que Precisam de Ajuda
              </h3>
              <p className={`mb-6 ${
                isDark ? "text-white/80" : "text-slate-700"
              }`}>
                Nossos guias são o melhor lugar para começar! Encontre orientações, dicas e recursos
                que vão te ajudar em sua jornada acadêmica no Centro de Informática.
              </p>
              <Button asChild size="lg" variant="outline" className={
                isDark 
                  ? "border-white text-white hover:bg-white/20" 
                  : "border-blue-900 text-blue-900 hover:bg-blue-50"
              }>
                <Link href="/guias">Explorar Guias</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </BackgroundGradientAnimation>
  );
}
