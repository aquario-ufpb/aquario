"use client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Github, CheckCircle2, AlertCircle, Mail, Users, Search, Zap } from "lucide-react";
import WaterRippleEffect from "@/components/ui/water-ripple-effect";

export default function SobrePage() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : true;

  if (!mounted) {
    return null;
  }

  return (
    <main className="relative pt-0">
      {/* Hero Section - Full Width and Height */}
      <div className="relative overflow-x-hidden overflow-y-hidden w-full h-[85vh]">
        {/* Circular gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? "radial-gradient(circle at 25% 50%, #1a3a5c 0%, #0f2338 100%)"
              : "radial-gradient(circle at 25% 50%, #DCF0FF 0%, #C8E6FA 100%)",
          }}
        />

        <div className="relative flex flex-col md:flex-row items-center h-full w-full max-w-7xl mx-auto px-4 md:px-8 md:pr-12 pt-24">
          {/* Fish Image - Left Side - Hidden on mobile */}
          <div className="hidden md:flex flex-1 relative w-full md:w-2/3 h-full mb-8 md:mb-0 items-center justify-start">
            <div className="relative w-full h-full -ml-8 md:-ml-16">
              {/* Blur effect - behind the fish */}
              <div className="absolute inset-0 z-0">
                <Image
                  src="/blur.svg"
                  alt="Blur effect"
                  fill
                  className="object-contain object-left"
                  style={{ transform: "translateX(-10%)" }}
                />
              </div>
              {/* Fish - on top */}
              <div
                className="relative z-10 w-[120%] h-[120%] -ml-[10%] -mt-[10%]"
                style={{
                  transform: "scale(0.8) translateX(-8%) translateY(15%)",
                }}
              >
                <WaterRippleEffect
                  imageSrc={isDark ? "/vector4.svg" : "/vector3.svg"}
                  width={1632}
                  height={1246}
                  className="object-contain object-left"
                  containerClassName="w-full h-full"
                  scale={0.8}
                />
              </div>
            </div>
          </div>

          {/* Text Content - Full width on mobile, right side on desktop */}
          <div className="flex-1 flex flex-col items-center md:items-end justify-center space-y-4 md:pl-8 text-center md:text-right w-full">
            <h1
              className="font-display text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight"
              style={{ color: isDark ? "#D0EFFF" : "#285A96" }}
            >
              <span className="block">Sobre o</span>
              <span className="block">Aquário</span>
            </h1>

            <p
              className="text-base md:text-lg leading-relaxed max-w-md"
              style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
            >
              Um projeto open source focado em centralizar informações relevantes para os alunos do
              Centro de Informática (CI) da UFPB.
            </p>

            <div className="pt-2">
              <Button
                asChild
                size="lg"
                className="rounded-lg font-normal hover:opacity-90 transition-opacity flex items-center gap-1 px-5"
                style={{
                  backgroundColor: isDark ? "#1a3a5c" : "#ffffff",
                  color: isDark ? "#C8E6FA" : "#0e3a6c",
                }}
              >
                <Link
                  href="https://github.com/aquario-ufpb/aquario"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="w-6 h-6" />
                  <span className="text-2md">Contribua para o Aquário</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of the content */}
      <div className="space-y-0">
        {/* Problem Statement */}
        <section className={`w-full p-12 md:p-20 ${isDark ? "bg-white/5" : "bg-white"}`}>
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2
                className="text-4xl md:text-5xl font-display font-bold mb-4"
                style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
              >
                O Problema que Resolvemos
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              {/* Before Card */}
              <div>
                <h3
                  className={`text-xl font-semibold mb-8 ${
                    isDark ? "text-white/60" : "text-slate-500"
                  }`}
                >
                  Antes do Aquário
                </h3>
                <ul className="space-y-5">
                  {[
                    { icon: AlertCircle, text: "Falta de informação centralizada" },
                    { icon: Search, text: "Excesso de locais para buscar informações" },
                    {
                      icon: Users,
                      text: "Dificuldade de comunicação entre alunos, professores e laboratórios",
                    },
                    { icon: Mail, text: "Vagas perdidas em e-mails" },
                    { icon: Zap, text: "Projetos sem visibilidade" },
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-4">
                      <item.icon
                        className={`w-5 h-5 mt-1 flex-shrink-0 ${
                          isDark ? "text-blue-400" : "text-blue-600"
                        }`}
                      />
                      <span
                        className={`text-lg leading-relaxed ${
                          isDark ? "text-white/90" : "text-slate-700"
                        }`}
                      >
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* After Card */}
              <div>
                <h3
                  className={`text-xl font-semibold mb-8 ${
                    isDark ? "text-white/60" : "text-slate-500"
                  }`}
                >
                  Com o Aquário
                </h3>
                <ul className="space-y-5">
                  {[
                    { icon: Zap, text: "Informações centralizadas em um só lugar" },
                    { icon: Users, text: "Comunicação eficiente e organizada" },
                    { icon: Search, text: "Facilidade de acesso a oportunidades" },
                    { icon: Mail, text: "Melhor organização de vagas e projetos" },
                    { icon: CheckCircle2, text: "Comunidade conectada e colaborativa" },
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-4">
                      <item.icon
                        className={`w-5 h-5 mt-1 flex-shrink-0 ${
                          isDark ? "text-cyan-400" : "text-cyan-600"
                        }`}
                      />
                      <span
                        className={`text-lg leading-relaxed ${
                          isDark ? "text-white/90" : "text-slate-700"
                        }`}
                      >
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          className={`w-full p-12 md:py-16 ${isDark ? "bg-white/5" : ""}`}
          style={{
            background: isDark
              ? "radial-gradient(circle at 50% 50%, #1a3a5c 0%, #0f2338 100%)"
              : "radial-gradient(circle at 50% 50%, #DCF0FF 0%, #C8E6FA 100%)",
          }}
        >
          <div className="container mx-auto max-w-4xl">
            <h2
              className="text-4xl font-display font-bold mb-8 text-center"
              style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
            >
              Funcionalidades
            </h2>
            <div className="space-y-6">
              <p
                className="text-lg md:text-xl leading-relaxed text-center"
                style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}
              >
                O Aquário é uma plataforma em constante evolução, desenvolvida para centralizar e
                organizar informações essenciais para a comunidade acadêmica do Centro de
                Informática da UFPB. Nosso objetivo é facilitar o acesso a oportunidades, projetos,
                laboratórios e recursos educacionais, criando um hub completo onde alunos,
                professores e laboratórios possam se conectar e colaborar.
              </p>
              <p
                className="text-lg md:text-xl leading-relaxed text-center"
                style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}
              >
                A versão atual, lançada no semestre <strong>2025.2</strong>, já conta com as
                funcionalidades de <strong>Guias</strong> e <strong>Entidades</strong> totalmente
                disponíveis. Estes módulos permitem que os alunos encontrem orientações sobre cursos
                e disciplinas, além de explorarem o diretório completo de laboratórios, grupos de
                pesquisa, ligas acadêmicas e outras entidades do CI.
              </p>
              <p
                className="text-lg md:text-xl leading-relaxed text-center"
                style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}
              >
                Estamos trabalhando continuamente para expandir as funcionalidades da plataforma,
                incluindo sistema de vagas, blog e publicações, achados e perdidos, e muito mais. O
                Aquário é um projeto open source e novas contribuições são sempre bem-vindas!
              </p>
            </div>
          </div>
        </section>

        {/* Open Source Section */}
        <section className={`w-full p-12 md:py-16 ${isDark ? "bg-white/5" : "bg-white"}`}>
          <div className="container mx-auto max-w-4xl">
            <Card
              className={`p-8 md:p-12 text-center rounded-3xl ${
                isDark ? "bg-white/5" : "border-slate-200 bg-white/80"
              }`}
              style={isDark ? { border: "2px solid rgba(208, 239, 255, 0.7)" } : {}}
            >
              <CardHeader>
                <CardTitle
                  className="text-4xl font-display font-bold mb-6"
                  style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
                >
                  Projeto Open Source
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <p
                  className="text-lg md:text-xl leading-relaxed max-w-3xl mx-auto"
                  style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}
                >
                  O Aquário é um projeto open source licenciado sob a Licença MIT, e as
                  contribuições são muito bem-vindas! Acreditamos que qualquer pessoa pode
                  contribuir para tornar esta plataforma melhor - seja você um estudante novato no
                  CI, um veterano, ou mesmo alguém de fora da comunidade acadêmica.
                </p>
                <p
                  className="text-base md:text-lg leading-relaxed max-w-3xl mx-auto"
                  style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}
                >
                  Para começar a contribuir, basta seguir o tutorial detalhado disponível nos
                  arquivos README do repositório. O processo é simples: faça um fork do projeto,
                  crie suas alterações e abra uma Pull Request. Todas as contribuições são revisadas
                  e muito valorizadas!
                </p>

                {/* GitHub Contributors - Bigger Impact */}
                <div className="pt-6">
                  <p
                    className="text-lg md:text-xl font-semibold mb-6"
                    style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
                  >
                    Nossos Contribuidores
                  </p>
                  <a
                    href="https://github.com/aquario-ufpb/aquario/graphs/contributors"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block transition-transform hover:scale-105"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://contrib.rocks/image?repo=aquario-ufpb/aquario"
                      alt="Contributors"
                      className="w-full max-w-2xl mx-auto rounded-xl"
                    />
                  </a>
                  <p
                    className="text-sm mt-4 opacity-70"
                    style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
                  >
                    Clique para ver todos os contribuidores no GitHub
                  </p>
                </div>

                <div className="flex justify-center gap-4 flex-wrap pt-4">
                  <Button asChild variant="outline" size="lg" className="rounded-full">
                    <a
                      href="https://github.com/aquario-ufpb/aquario"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Github className="w-5 h-5" />
                      Contribuir no GitHub
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full">
                    <a href="mailto:ralf.ferreira@academico.ufpb.br">Entrar em Contato</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
