"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Map, BookOpen } from "lucide-react";

export default function FerramentasPage() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;

  const ferramentas = [
    {
      id: "calendario",
      title: "Calendário de Alocação",
      description:
        "Crie e visualize seu calendário personalizado com as disciplinas selecionadas. Busque por código, nome, professor ou localização e veja sua grade horária de forma visual e organizada.",
      href: "/calendario",
      icon: Calendar,
      imagePath: "/calendario",
    },
    {
      id: "maps",
      title: "Mapas dos Prédios",
      description:
        "Explore os mapas interativos dos prédios do Centro de Informática. Visualize plantas baixas, navegue entre andares e descubra informações sobre cada sala e laboratório.",
      href: "/mapas",
      icon: Map,
      imagePath: "/mapas",
    },
    {
      id: "guias",
      title: "Guias e Recursos",
      description:
        "Encontre orientações, dicas e recursos que vão te ajudar em sua jornada acadêmica no Centro de Informática. Tudo que precisa saber para começar seu curso.",
      href: "/guias",
      icon: BookOpen,
      imagePath: "/guias",
    },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl mt-20">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-4xl md:text-5xl font-display font-bold mb-4"
          style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
        >
          Ferramentas
        </h1>
        <p className="text-lg md:text-xl" style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}>
          Ferramentas úteis para estudantes do Centro de Informática
        </p>
      </div>

      {/* Ferramentas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ferramentas.map(ferramenta => {
          const Icon = ferramenta.icon;
          return (
            <Link key={ferramenta.id} href={ferramenta.href}>
              <Card
                className={`h-full transition-all hover:shadow-lg cursor-pointer ${
                  isDark
                    ? "bg-white/5 border-white/20 hover:bg-white/10"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <CardHeader>
                  <CardTitle
                    className="flex items-center gap-3"
                    style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
                  >
                    <Icon className="w-6 h-6" />
                    {ferramenta.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}
                  >
                    {ferramenta.description}
                  </p>
                  {ferramenta.imagePath && (
                    <div className="mt-auto">
                      <Image
                        src={
                          isDark
                            ? `${ferramenta.imagePath}/dark.png`
                            : `${ferramenta.imagePath}/light.png`
                        }
                        alt={ferramenta.title}
                        width={300}
                        height={150}
                        className="w-full h-auto object-contain rounded-lg shadow-md"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
