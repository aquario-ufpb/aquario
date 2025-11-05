"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Inter } from "next/font/google";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SubSectionNode = {
  titulo: string;
  slug: string;
};

type SectionNode = {
  titulo: string;
  slug: string;
  subsecoes?: SubSectionNode[];
};

type GuiaNode = {
  titulo: string;
  slug: string;
  secoes: SectionNode[];
};

type GuideIndexProps = {
  guias: GuiaNode[];
};

const inter = Inter({ subsets: ["latin"] });

export const GuideIndex: React.FC<GuideIndexProps> = ({ guias }) => {
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionKey)) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      return next;
    });
  };

  const isSectionActive = React.useCallback(
    (guiaSlug: string, secaoSlug: string, subSlug?: string) => {
      const basePath = `/guias/${guiaSlug}/${secaoSlug}`;
      if (subSlug) {
        return pathname === `${basePath}/${subSlug}`;
      }
      return pathname === basePath;
    },
    [pathname]
  );

  // Auto-expand sections that contain the active page
  React.useEffect(() => {
    const newExpanded = new Set<string>();
    guias.forEach(guia => {
      guia.secoes.forEach(secao => {
        if (secao.subsecoes && secao.subsecoes.length > 0) {
          const sectionKey = `${guia.slug}-${secao.slug}`;
          // Check if any subsection is active
          const hasActiveSub = secao.subsecoes.some(sub =>
            isSectionActive(guia.slug, secao.slug, sub.slug)
          );
          // Check if section itself is active
          const isSectionActiveState = isSectionActive(guia.slug, secao.slug);
          if (hasActiveSub || isSectionActiveState) {
            newExpanded.add(sectionKey);
          }
        }
      });
    });
    setExpandedSections(newExpanded);
  }, [pathname, guias, isSectionActive]);

  return (
    <div className="h-full overflow-y-auto flex flex-col bg-gray-50/50 dark:bg-gray-900/50">
      <div className={`space-y-1 w-full p-4 flex-1 ${inter.className}`}>
        {guias.map(guia => (
          <div key={guia.slug} className="mb-4">
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2 px-2 pt-2"
              style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
            >
              {guia.titulo}
            </p>
            <div className="space-y-0 gap-0">
              {guia.secoes.map(secao => {
                const sectionKey = `${guia.slug}-${secao.slug}`;
                const hasSubsections = secao.subsecoes && secao.subsecoes.length > 0;
                const isExpanded = expandedSections.has(sectionKey);
                const secaoUrl = `/guias/${guia.slug}/${secao.slug}`;
                const isSecaoActive = isSectionActive(guia.slug, secao.slug);

                return (
                  <div key={secao.slug} className="space-y-0.5">
                    <div className="flex items-center group">
                      {hasSubsections && (
                        <button
                          onClick={() => toggleSection(sectionKey)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? (
                            <ChevronDown
                              className="h-3.5 w-3.5"
                              style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
                            />
                          ) : (
                            <ChevronRight
                              className="h-3.5 w-3.5"
                              style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
                            />
                          )}
                        </button>
                      )}
                      {!hasSubsections && <div className="w-5" />}
                      <Link
                        href={secaoUrl}
                        className={cn(
                          "flex-1 py-2 px-3 rounded-md text-sm transition-colors",
                          isSecaoActive
                            ? isDark
                              ? "bg-blue-900/30 font-medium"
                              : "bg-blue-100 font-medium"
                            : isDark
                              ? "hover:bg-gray-800"
                              : "hover:bg-gray-100"
                        )}
                        style={{
                          color: isSecaoActive
                            ? isDark
                              ? "#D0EFFF"
                              : "#0e3a6c"
                            : isDark
                              ? "#E5F6FF"
                              : "#0e3a6c",
                        }}
                      >
                        {secao.titulo}
                      </Link>
                    </div>
                    {hasSubsections && isExpanded && (
                      <div className="ml-6 space-y-0.5">
                        {secao.subsecoes?.map(sub => {
                          const subUrl = `${secaoUrl}/${sub.slug}`;
                          const isSubActive = isSectionActive(guia.slug, secao.slug, sub.slug);
                          return (
                            <Link
                              key={sub.slug}
                              href={subUrl}
                              className={cn(
                                "block py-1.5 px-3 rounded-md text-sm transition-colors",
                                isSubActive
                                  ? isDark
                                    ? "bg-blue-900/30 font-medium"
                                    : "bg-blue-100 font-medium"
                                  : isDark
                                    ? "hover:bg-gray-800"
                                    : "hover:bg-gray-100"
                              )}
                              style={{
                                color: isSubActive
                                  ? isDark
                                    ? "#D0EFFF"
                                    : "#0e3a6c"
                                  : isDark
                                    ? "#C8E6FA"
                                    : "#0e3a6c",
                              }}
                            >
                              {sub.titulo}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GuideIndex;
