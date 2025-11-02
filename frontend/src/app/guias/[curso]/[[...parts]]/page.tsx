"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import GradientHeaderComponent from "@/components/shared/gradient-header";
import { GuideIndex } from "@/components/shared/guide-index";
import MarkdownRenderer from "@/components/shared/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlignJustify } from "lucide-react";
import { useGuiasPage } from "@/hooks";

export default function GuiasCursoPage() {
  const params = useParams<{ curso: string; parts?: string[] }>();
  const router = useRouter();
  const cursoSlug = params?.curso;
  const parts = params?.parts as string[] | undefined;

  const {
    guiaTree,
    curso: _curso,
    isLoading,
    error,
    cursoSlugToNome,
    secoesData,
    subSecoesData,
  } = useGuiasPage(cursoSlug || "");

  const handleCourseChange = (courseName: string) => {
    // Map course name back to slug
    const courseSlugMap: Record<string, string> = {
      "Ciência da Computação": "ciencia-da-computacao",
      "Engenharia da Computação": "engenharia-da-computacao",
      "Ciências de Dados e Inteligência Artificial": "ciencias-de-dados-e-inteligencia-artificial",
    };
    const newSlug = courseSlugMap[courseName];
    if (newSlug) {
      router.push(`/guias/${newSlug}`);
    }
  };

  const currentContent = useMemo(() => {
    if (!parts || parts.length === 0) {
      return "# Selecione uma seção à esquerda";
    }

    // URL structure: /guias/{curso}/{guia}/{secao}/{subsecao?}
    const [guiaSlug, secaoSlug, subSlug] = parts;

    if (!guiaSlug) {
      return "# Guia não especificado";
    }

    // Find the section within the specific guia
    let targetSecao = null;
    if (secoesData && secoesData[guiaSlug]) {
      const secoes = secoesData[guiaSlug];
      const secao = secoes.find(s => s.slug === secaoSlug);
      if (secao) {
        targetSecao = secao;
      }
    }

    if (!targetSecao) {
      return "# Seção não encontrada";
    }

    if (!subSlug) {
      return targetSecao.conteudo || "# Conteúdo não disponível";
    }

    // Find the subsection by slug
    if (subSecoesData && subSecoesData[targetSecao.slug]) {
      const subSecoes = subSecoesData[targetSecao.slug];
      const subSecao = subSecoes.find(s => s.slug === subSlug);
      if (subSecao) {
        return subSecao.conteudo || "# Conteúdo não disponível";
      }
    }

    return "# Sub-seção não encontrada";
  }, [parts, secoesData, subSecoesData]);

  const currentTitle = useMemo(() => {
    const partsList = parts || [];
    return [cursoSlug, ...partsList].join(" / ").replace(/-/g, " ");
  }, [cursoSlug, parts]);

  if (isLoading) {
    return <div className="p-8">Carregando…</div>;
  }
  if (error) {
    return <div className="p-8 text-red-500">{error?.message || "Erro ao carregar guias"}</div>;
  }

  return (
    <div className="fixed inset-x-0 top-[60px] bottom-0 flex flex-col overflow-hidden">
      <GradientHeaderComponent
        academicCenter="Centro de Informática"
        courses={[
          "Ciência da Computação",
          "Engenharia da Computação",
          "Ciências de Dados e Inteligência Artificial",
        ]}
        currentCourse={cursoSlugToNome[cursoSlug as keyof typeof cursoSlugToNome] || "Curso"}
        onCourseChange={handleCourseChange}
      />

      <div className="flex md:flex-row w-full flex-col flex-1 min-h-0 overflow-hidden">
        <div className="w-[300px] hidden md:flex flex-col h-full overflow-hidden">
          <GuideIndex cursoSlug={cursoSlug} guias={guiaTree} />
        </div>
        <div className="md:hidden pl-4 pt-4 pb-4">
          <Sheet key={"left"}>
            <SheetTrigger asChild>
              <Button variant="outline">
                <AlignJustify size={12} />
              </Button>
            </SheetTrigger>
            <SheetContent side={"left"}>
              <SheetHeader>
                <SheetTitle className="pb-4">O que procura?</SheetTitle>
              </SheetHeader>
              <GuideIndex cursoSlug={cursoSlug} guias={guiaTree} />
            </SheetContent>
          </Sheet>
        </div>
        <div className="w-[1.5px] bg-gray-500 opacity-30 flex-shrink-0"></div>
        <div className="flex-1 flex flex-col h-full overflow-hidden px-8">
          <MarkdownRenderer content={currentContent} title={currentTitle} />
        </div>
      </div>
    </div>
  );
}
