"use client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Github } from "lucide-react";
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

  const features = [
    {
      title: "Blog & Publicações",
      description: "Compartilhamento de conhecimento e informações",
      status: "development",
      items: [
        "Posts de usuários cadastrados",
        "Informações de centros acadêmicos",
        "Projetos pessoais e de laboratórios",
        "Dicas de veteranos e professores",
      ],
    },
    {
      title: "Laboratórios & Projetos",
      description: "Banco de dados de laboratórios verificados",
      status: "development",
      items: [
        "Contas verificadas de laboratórios",
        "Publicações de projetos detalhadas",
        "Informações de membros e tecnologias",
        "Casos de uso e soluções",
      ],
    },
    {
      title: "Vagas & Oportunidades",
      description: "Central de vagas de estágio e emprego",
      status: "development",
      items: [
        "Vagas de estágio e monitoria",
        "Projetos voluntários",
        "Iniciação científica",
        "Redução de spam de e-mails",
      ],
    },
    {
      title: "Achados e Perdidos",
      description: "Sistema automatizado e manual",
      status: "development",
      items: [
        "Scraping automático de e-mails",
        "Adições manuais de itens",
        "Perfil oficial da Tadea",
        "Organização eficiente",
      ],
    },
    {
      title: "FAQ & Guias",
      description: "Orientações para alunos iniciantes",
      status: "available",
      items: [
        "Guias sobre diversos assuntos",
        "Dúvidas e respostas frequentes",
        "Documentos importantes",
        "Orientações para períodos iniciais",
      ],
    },
    {
      title: "Centralização",
      description: "Tudo em um só lugar",
      status: "development",
      items: [
        "Informações do CI centralizadas",
        "Comunicação eficiente",
        "Facilidade de acesso",
        "Comunidade conectada",
      ],
    },
  ];

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

        <div className="relative flex flex-col md:flex-row items-center h-full w-full max-w-7xl mx-auto pl-0 pr-8 md:pr-12 pt-24">
          {/* Fish Image - Left Side */}
          <div className="flex-1 relative w-full md:w-2/3 h-full mb-8 md:mb-0 flex items-center justify-start">
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

          {/* Text Content - Right Side */}
          <div className="flex-1 flex flex-col items-end justify-center space-y-4 md:pl-8 text-right">
            <h1
              className="font-display text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight"
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
                className="rounded-lg font-normal hover:opacity-90 transition-opacity flex items-center gap-1"
                style={{
                  backgroundColor: isDark ? "#1a3a5c" : "#ffffff",
                  color: isDark ? "#C8E6FA" : "#0e3a6c",
                }}
              >
                <Link
                  href="https://github.com/ralfferreira/aquario"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="w-6 h-6" />
                  <span className="text-md">Contribua</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of the content */}
      <div className="space-y-0">
        {/* Problem Statement */}
        <section className={`w-full p-12 md:py-16 ${isDark ? "bg-white/5" : "bg-white"}`}>
          <div className="container mx-auto max-w-6xl">
            <h2
              className="text-4xl font-display font-bold mb-10 text-center"
              style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
            >
              O Problema que Resolvemos
            </h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div
                className="relative p-12 md:p-16 rounded-[3rem] overflow-hidden"
                style={isDark ? { border: "1px solid rgba(208, 239, 255, 0.5)" } : {}}
              >
                {!isDark && (
                  <div className="absolute inset-0 z-0">
                    <Image
                      src="/blur2.svg"
                      alt="Blur effect"
                      fill
                      className="object-cover opacity-60 rounded-[3rem]"
                    />
                  </div>
                )}
                <div className="relative z-10">
                  <div className="flex justify-center mb-6">
                    <h3
                      className="text-2xl font-bold px-2 py-1 rounded-lg inline-block"
                      style={{
                        color: isDark ? "#FFB3B5" : "#0e3a6c",
                        backgroundColor: isDark
                          ? "rgba(229, 108, 110, 0.6)"
                          : "rgba(229, 108, 110, 0.4)",
                      }}
                    >
                      Antes do Aquário
                    </h3>
                  </div>
                  <ul className="space-y-3 text-lg leading-relaxed pl-6">
                    <li className="flex items-start gap-3">
                      <span className="text-2xl mt-1">•</span>
                      <span style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}>
                        Falta de informação centralizada
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl mt-1">•</span>
                      <span style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}>
                        Excesso de locais para buscar informações
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl mt-1">•</span>
                      <span style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}>
                        Dificuldade de comunicação entre alunos, professores e laboratórios
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl mt-1">•</span>
                      <span style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}>
                        Vagas perdidas em e-mails
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl mt-1">•</span>
                      <span style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}>
                        Projetos sem visibilidade
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              <div
                className="relative p-12 md:p-16 rounded-[3rem] overflow-hidden"
                style={isDark ? { border: "1px solid rgba(208, 239, 255, 0.5)" } : {}}
              >
                {!isDark && (
                  <div className="absolute inset-0 z-0">
                    <Image
                      src="/blur3.svg"
                      alt="Blur effect"
                      fill
                      className="object-cover opacity-60 rounded-[3rem]"
                    />
                  </div>
                )}
                <div className="relative z-10">
                  <div className="flex justify-center mb-6">
                    <h3
                      className="text-2xl font-bold px-2 py-1 rounded-lg inline-block"
                      style={{
                        color: isDark ? "#B3FFD9" : "#0e3a6c",
                        backgroundColor: isDark
                          ? "rgba(95, 167, 125, 0.6)"
                          : "rgba(95, 167, 125, 0.4)",
                      }}
                    >
                      Com o Aquário
                    </h3>
                  </div>
                  <ul className="space-y-3 text-lg leading-relaxed pl-6">
                    <li className="flex items-start gap-3">
                      <span className="text-2xl mt-1">•</span>
                      <span style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}>
                        Informações centralizadas em um só lugar
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl mt-1">•</span>
                      <span style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}>
                        Comunicação eficiente e organizada
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl mt-1">•</span>
                      <span style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}>
                        Facilidade de acesso a oportunidades
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl mt-1">•</span>
                      <span style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}>
                        Melhor organização de vagas e projetos
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl mt-1">•</span>
                      <span style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}>
                        Comunidade conectada e colaborativa
                      </span>
                    </li>
                  </ul>
                </div>
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
          <div className="container mx-auto max-w-6xl">
            <h2
              className="text-4xl font-display font-bold mb-12 text-center"
              style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
            >
              Funcionalidades
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className={`relative transition-all duration-300 hover:scale-105 ${
                    feature.status === "available"
                      ? isDark
                        ? "border-green-500/50 bg-green-950/20"
                        : "border-green-200 bg-green-50/50"
                      : isDark
                        ? "border-white/10 bg-white/5"
                        : "border-slate-200 bg-white/50"
                  }`}
                >
                  <div className="absolute top-4 right-4 z-10">
                    <Badge
                      variant={feature.status === "available" ? "default" : "secondary"}
                      className={`text-xs ${
                        feature.status === "available" ? "bg-green-600 hover:bg-green-700" : ""
                      }`}
                    >
                      {feature.status === "available" ? "Disponível" : "Em Desenvolvimento"}
                    </Badge>
                  </div>
                  <CardHeader className={feature.status === "available" ? "" : "opacity-40"}>
                    <CardTitle
                      className="text-xl font-bold"
                      style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}
                    >
                      {feature.title}
                    </CardTitle>
                    <CardDescription
                      className="mt-2"
                      style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
                    >
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className={feature.status === "available" ? "" : "opacity-40"}>
                    <ul className="space-y-2 text-sm">
                      {feature.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-2">
                          <span className="text-xs mt-1">•</span>
                          <span style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Objective and Open Source Section */}
        <section className={`w-full p-12 md:py-16 ${isDark ? "bg-white/5" : "bg-white"}`}>
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-6">
              <Card
                className={`p-8 text-center rounded-3xl ${
                  isDark ? "bg-white/5" : "border-slate-200 bg-white/80"
                }`}
                style={isDark ? { border: "2px solid rgba(208, 239, 255, 0.7)" } : {}}
              >
                <CardHeader>
                  <CardTitle
                    className="text-3xl font-display font-bold mb-4"
                    style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
                  >
                    Objetivo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p
                    className="text-lg leading-relaxed"
                    style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}
                  >
                    O objetivo do projeto Aquário é centralizar as informações do CI e oferecer uma
                    solução eficiente para problemas de comunicação e disseminação de informações,
                    facilitando o acesso e o compartilhamento de informações importantes entre todos
                    os membros da comunidade acadêmica.
                  </p>
                </CardContent>
              </Card>
              <Card
                className={`p-8 text-center rounded-3xl ${
                  isDark ? "bg-white/5" : "border-slate-200 bg-white/80"
                }`}
                style={isDark ? { border: "2px solid rgba(208, 239, 255, 0.7)" } : {}}
              >
                <CardHeader>
                  <CardTitle
                    className="text-3xl font-display font-bold mb-4"
                    style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
                  >
                    Projeto Open Source
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p
                    className="text-lg leading-relaxed"
                    style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}
                  >
                    O Aquário é um projeto open source e as contribuições são muito bem-vindas! Este
                    projeto está licenciado sob a Licença MIT.
                  </p>
                  <div className="flex justify-center gap-4 flex-wrap">
                    <Button asChild variant="outline" size="lg" className="rounded-full">
                      <a
                        href="https://github.com/ralfferreira/aquario"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
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
          </div>
        </section>

        {/* Status Badge */}
        <div className={`w-full text-center p-12 md:py-16 ${isDark ? "bg-white/5" : "bg-white"}`}>
          <div className="container mx-auto max-w-6xl">
            <Badge
              variant="secondary"
              className="text-base px-6 py-3"
              style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
            >
              Projeto em Desenvolvimento - Mais funcionalidades em breve!
            </Badge>
          </div>
        </div>
      </div>
    </main>
  );
}
