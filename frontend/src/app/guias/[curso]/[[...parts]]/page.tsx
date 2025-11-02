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
      const cursoNome = cursoSlugToNome[cursoSlug as keyof typeof cursoSlugToNome] || "Curso";
      let summary = `# Bem-vindo ao curso ${cursoNome}\n\nAqui estão todos os tópicos disponíveis para explorar:\n\n`;

      if (guiaTree && guiaTree.length > 0) {
        guiaTree.forEach((guia, guiaIndex) => {
          summary += `## ${guia.titulo}\n\n`;

          if (guia.secoes && guia.secoes.length > 0) {
            guia.secoes.forEach(secao => {
              const secaoUrl = `/guias/${cursoSlug}/${guia.slug}/${secao.slug}`;
              summary += `- [${secao.titulo}](${secaoUrl})`;

              if (secao.subsecoes && secao.subsecoes.length > 0) {
                summary += "\n";
                secao.subsecoes.forEach(subsecao => {
                  const subsecaoUrl = `${secaoUrl}/${subsecao.slug}`;
                  summary += `  - [${subsecao.titulo}](${subsecaoUrl})\n`;
                });
              } else {
                summary += "\n";
              }
            });
          }

          if (guiaIndex < guiaTree.length - 1) {
            summary += "\n";
          }
        });
      } else {
        summary += "Nenhum tópico disponível no momento.";
      }

      return summary;
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
  }, [parts, secoesData, subSecoesData, guiaTree, cursoSlug, cursoSlugToNome]);

  const breadcrumbs = useMemo(() => {
    const crumbs: Array<{ label: string; href?: string }> = [{ label: "Guias", href: "/guias" }];

    if (!cursoSlug) {
      return crumbs;
    }

    const cursoNome = cursoSlugToNome[cursoSlug as keyof typeof cursoSlugToNome] || cursoSlug;
    crumbs.push({ label: cursoNome, href: `/guias/${cursoSlug}` });

    if (!parts || parts.length === 0) {
      crumbs.push({ label: "Índice" });
      return crumbs;
    }

    const [guiaSlug, secaoSlug, subSlug] = parts;

    if (guiaSlug && guiaTree) {
      const guia = guiaTree.find(g => g.slug === guiaSlug);
      if (guia) {
        crumbs.push({ label: guia.titulo, href: `/guias/${cursoSlug}` });

        if (secaoSlug) {
          const secao = guia.secoes?.find(s => s.slug === secaoSlug);
          if (secao) {
            crumbs.push({
              label: secao.titulo,
              href: `/guias/${cursoSlug}/${guiaSlug}/${secaoSlug}`,
            });

            if (subSlug) {
              const subSecao = secao.subsecoes?.find(sub => sub.slug === subSlug);
              if (subSecao) {
                crumbs.push({ label: subSecao.titulo });
              } else {
                crumbs.push({ label: subSlug });
              }
            }
          } else {
            crumbs.push({ label: secaoSlug });
          }
        }
      } else {
        crumbs.push({ label: guiaSlug });
      }
    }

    return crumbs;
  }, [cursoSlug, parts, cursoSlugToNome, guiaTree]);

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
            <SheetContent side={"left"} className="p-0">
              <SheetHeader className="px-6 pt-6">
                <SheetTitle className="pb-4">O que procura?</SheetTitle>
              </SheetHeader>
              <GuideIndex cursoSlug={cursoSlug} guias={guiaTree} />
            </SheetContent>
          </Sheet>
        </div>
        <div className="flex-1 flex flex-col h-full overflow-hidden px-8">
          <MarkdownRenderer
            content={currentContent}
            breadcrumbs={breadcrumbs}
            basePath={
              parts && parts.length > 0
                ? `/guias/${cursoSlug}/${parts.join("/")}`
                : `/guias/${cursoSlug}`
            }
          />
        </div>
      </div>
    </div>
  );
}
