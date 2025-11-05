"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { GuideIndex } from "@/components/shared/guide-index";
import MarkdownRenderer from "@/components/shared/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlignJustify } from "lucide-react";
import { useGuiasPage } from "@/hooks";

export default function GuiasPage() {
  const params = useParams<{ parts?: string[] }>();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const parts = params?.parts as string[] | undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;

  const { guiaTree, isLoading, error, secoesData, subSecoesData } = useGuiasPage();

  const currentContent = useMemo(() => {
    if (!parts || parts.length === 0) {
      let summary = `# Bem-vindo aos Guias do Centro de Informática\n\nAqui estão todos os tópicos disponíveis para explorar:\n\n`;

      if (guiaTree && guiaTree.length > 0) {
        guiaTree.forEach((guia, guiaIndex) => {
          summary += `## ${guia.titulo}\n\n`;

          if (guia.secoes && guia.secoes.length > 0) {
            guia.secoes.forEach(secao => {
              const secaoUrl = `/guias/${guia.slug}/${secao.slug}`;
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

    // URL structure: /guias/{guia}/{secao}/{subsecao?}
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
  }, [parts, secoesData, subSecoesData, guiaTree]);

  const breadcrumbs = useMemo(() => {
    const crumbs: Array<{ label: string; href?: string }> = [{ label: "Guias", href: "/guias" }];

    if (!parts || parts.length === 0) {
      crumbs.push({ label: "Índice" });
      return crumbs;
    }

    const [guiaSlug, secaoSlug, subSlug] = parts;

    if (guiaSlug && guiaTree) {
      const guia = guiaTree.find(g => g.slug === guiaSlug);
      if (guia) {
        crumbs.push({ label: guia.titulo, href: `/guias` });

        if (secaoSlug) {
          const secao = guia.secoes?.find(s => s.slug === secaoSlug);
          if (secao) {
            crumbs.push({
              label: secao.titulo,
              href: `/guias/${guiaSlug}/${secaoSlug}`,
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
  }, [parts, guiaTree]);

  if (isLoading) {
    return (
      <div className="p-8" style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}>
        Carregando…
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-8" style={{ color: isDark ? "#FFB3B5" : "#d32f2f" }}>
        {error?.message || "Erro ao carregar guias"}
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 top-[90px] bottom-0 flex flex-col overflow-hidden">
      <div className="flex md:flex-row w-full flex-col flex-1 min-h-0 overflow-hidden">
        <div className="w-[300px] hidden md:flex flex-col h-full overflow-hidden">
          <GuideIndex guias={guiaTree} />
        </div>
        <div className="md:hidden pl-4 pt-4 pb-4">
          <Sheet key={"left"}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                style={{
                  backgroundColor: isDark ? "#1a3a5c" : "#ffffff",
                  color: isDark ? "#C8E6FA" : "#0e3a6c",
                  borderColor: isDark ? "rgba(208, 239, 255, 0.3)" : "rgba(14, 58, 108, 0.2)",
                }}
              >
                <AlignJustify size={12} />
              </Button>
            </SheetTrigger>
            <SheetContent side={"left"} className="p-0">
              <SheetHeader className="px-6 pt-6">
                <SheetTitle className="pb-4" style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>
                  O que procura?
                </SheetTitle>
              </SheetHeader>
              <GuideIndex guias={guiaTree} />
            </SheetContent>
          </Sheet>
        </div>
        <div className="flex-1 flex flex-col h-full overflow-hidden lg:px-36 px-8">
          <MarkdownRenderer
            content={currentContent}
            breadcrumbs={breadcrumbs}
            basePath={parts && parts.length > 0 ? `/guias/${parts.join("/")}` : `/guias`}
          />
        </div>
      </div>
    </div>
  );
}
