import type { Metadata } from "next";
import { FeatureIllustration } from "@/components/pages/landing/features/feature-illustration";
import type { FeatureIllustrationVariant } from "@/components/pages/landing/features/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PAGE_HEADER_TEXT } from "@/lib/shared/constants/page-header-text";
import { SigaaMcpLink } from "@/components/shared/sigaa-mcp-link";
import {
  Activity,
  Bot,
  BookOpen,
  Calendar,
  CalendarDays,
  ExternalLink,
  GitBranch,
  MapIcon,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Recursos · Aquário",
  description:
    "Explore os recursos do Aquário para alunos do Centro de Informática da UFPB: minhas disciplinas, calendário acadêmico, mapas, grades curriculares, guias e mais.",
  alternates: { canonical: "/recursos" },
  openGraph: {
    title: "Recursos · Aquário",
    description:
      "Explore os recursos do Aquário para alunos do Centro de Informática da UFPB: minhas disciplinas, calendário acadêmico, mapas, grades curriculares, guias e mais.",
    url: "/recursos",
    type: "website",
  },
};

const recursos: Array<{
  id: string;
  title: string;
  description: string;
  href: string;
  icon: typeof Calendar;
  illustration: FeatureIllustrationVariant;
  external?: boolean;
}> = [
  {
    id: "calendario",
    title: "Minhas Disciplinas",
    description:
      "Gerencie suas disciplinas cursando, escolha turmas e visualize seu calendário personalizado. Busque por código, nome, professor ou localização.",
    href: "/calendario",
    icon: Calendar,
    illustration: "disciplines",
  },
  {
    id: "maps",
    title: "Mapas dos Prédios",
    description:
      "Explore os mapas interativos dos prédios do Centro de Informática. Visualize plantas baixas, navegue entre andares e descubra informações sobre cada sala e laboratório.",
    href: "/mapas",
    icon: MapIcon,
    illustration: "map",
  },
  {
    id: "grades",
    title: "Grades Curriculares",
    description:
      "Visualize a grade curricular do seu curso de forma interativa. Veja disciplinas por período, pré-requisitos e equivalências em um grafo visual.",
    href: "/grades-curriculares",
    icon: GitBranch,
    illustration: "curriculum",
  },
  {
    id: "calendario-academico",
    title: "Calendário Acadêmico",
    description:
      "Visualize os eventos e datas importantes do calendário acadêmico da UFPB. Consulte períodos de matrícula, feriados, exames finais e mais.",
    href: "/calendario-academico",
    icon: CalendarDays,
    illustration: "schedule",
  },
  {
    id: "guias",
    title: "Guias e Recursos",
    description:
      "Encontre orientações, dicas e recursos que vão te ajudar em sua jornada acadêmica no Centro de Informática. Tudo que precisa saber para começar seu curso.",
    href: "/guias",
    icon: BookOpen,
    illustration: "guides",
  },
  {
    id: "sigaa-caiu",
    title: "SIGAA Caiu?",
    description:
      "Confira se o SIGAA da UFPB está online, lento ou fora do ar com monitoramento automático.",
    href: "https://sigaacaiu.com",
    icon: Activity,
    illustration: "status",
    external: true,
  },
];

export default function RecursosPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl mt-20">
      {/* Header */}
      <PageHeader
        title={PAGE_HEADER_TEXT.recursos.title}
        subtitle={PAGE_HEADER_TEXT.recursos.subtitle}
      />

      <section aria-labelledby="sigaa-mcp-title" className="mb-8">
        <SigaaMcpLink
          location="resources_page"
          className="group flex min-h-28 flex-col gap-5 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm transition-colors hover:border-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-sky-900 dark:from-sky-950/60 dark:to-card sm:flex-row sm:items-center sm:p-6"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-aquario-primary text-white shadow-sm">
            <Bot className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="mb-2 flex flex-wrap items-center gap-2">
              <span
                id="sigaa-mcp-title"
                className="text-lg font-semibold text-slate-950 dark:text-white"
              >
                Leve o SIGAA para sua IA
              </span>
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-aquario-primary dark:bg-sky-900 dark:text-sky-100">
                Novo
              </span>
            </span>
            <span className="block max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              O MCP aberto do sigaa-for-ai-agents permite consultar informações do SIGAA no Claude,
              ChatGPT e outras ferramentas compatíveis. A configuração acontece fora do Aquário.
            </span>
          </span>
          <span className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full border border-sky-200 bg-white px-4 text-sm font-semibold text-aquario-primary transition-colors group-hover:bg-sky-50 dark:border-sky-800 dark:bg-white/5 dark:text-sky-100 dark:group-hover:bg-white/10 sm:self-auto">
            Ver projeto
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </span>
        </SigaaMcpLink>
      </section>

      {/* Recursos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recursos.map(recurso => {
          const Icon = recurso.icon;
          const card = (
            <Card className="h-full cursor-pointer border-slate-200 bg-white transition-all hover:border-slate-300 hover:shadow-lg dark:border-white/20 dark:bg-white/5 dark:hover:bg-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-[#0e3a6c] dark:text-[#C8E6FA]">
                  <Icon className="w-6 h-6" />
                  {recurso.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm leading-relaxed text-[#0e3a6c] dark:text-[#E5F6FF]">
                  {recurso.description}
                </p>
                <FeatureIllustration
                  variant={recurso.illustration}
                  groups={[]}
                  labs={[]}
                  appearance="surface"
                />
              </CardContent>
            </Card>
          );

          if (recurso.external) {
            return (
              <a key={recurso.id} href={recurso.href} target="_blank" rel="noopener noreferrer">
                {card}
              </a>
            );
          }

          return (
            <Link key={recurso.id} href={recurso.href}>
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
