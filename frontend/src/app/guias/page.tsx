"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GuiasPage() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;
  const router = useRouter();

  const courses = [
    {
      slug: "ciencia-da-computacao",
      name: "Ciência da Computação",
      description: "Fundamentos de programação, algoritmos e estruturas de dados",
    },
    {
      slug: "engenharia-da-computacao",
      name: "Engenharia da Computação",
      description: "Sistemas digitais, arquitetura de computadores e eletrônica",
    },
    {
      slug: "ciencias-de-dados-e-inteligencia-artificial",
      name: "Ciências de Dados e Inteligência Artificial",
      description: "Análise de dados, machine learning e inteligência artificial",
    },
  ];

  const handleCourseSelect = (courseSlug: string) => {
    router.push(`/guias/${courseSlug}`);
  };

  return (
    <div className="h-screen flex flex-col justify-start items-center px-4 pt-32 pb-4 overflow-hidden">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-4" style={{ color: isDark ? '#C8E6FA' : '#0e3a6c' }}>Guias Acadêmicos</h1>
        <p className="text-lg" style={{ color: isDark ? '#E5F6FF' : '#0e3a6c' }}>
          Selecione seu curso para acessar os guias disponíveis
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full flex-shrink-0">
        {courses.map(course => (
          <Card key={course.slug} className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-xl" style={{ color: isDark ? '#E5F6FF' : '#0e3a6c' }}>{course.name}</CardTitle>
              <CardDescription style={{ color: isDark ? '#C8E6FA' : '#0e3a6c' }}>{course.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button
                onClick={() => handleCourseSelect(course.slug)}
                className="w-full"
                variant="default"
                style={{ 
                  backgroundColor: isDark ? '#1a3a5c' : 'rgba(208, 239, 255, 0.5)',
                  color: isDark ? '#C8E6FA' : '#0e3a6c',
                  border: isDark ? '1px solid rgba(208, 239, 255, 0.3)' : '1px solid rgba(208, 239, 255, 0.6)'
                }}
              >
                Acessar Guias
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}