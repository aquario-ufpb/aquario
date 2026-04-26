import { FeatureIllustration } from "@/components/pages/landing/features/feature-illustration";
import type { FeatureIllustrationVariant } from "@/components/pages/landing/features/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PAGE_HEADER_TEXT } from "@/lib/shared/constants/page-header-text";
import { Activity, BookOpen, Calendar, CalendarDays, GitBranch, MapIcon } from "lucide-react";
import Link from "next/link";

const ferramentas: Array<{
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

export default function FerramentasPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl mt-20">
      {/* Header */}
      <PageHeader
        title={PAGE_HEADER_TEXT.ferramentas.title}
        subtitle={PAGE_HEADER_TEXT.ferramentas.subtitle}
      />

      {/* Ferramentas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ferramentas.map(ferramenta => {
          const Icon = ferramenta.icon;
          const card = (
            <Card className="h-full cursor-pointer border-slate-200 bg-white transition-all hover:border-slate-300 hover:shadow-lg dark:border-white/20 dark:bg-white/5 dark:hover:bg-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-[#0e3a6c] dark:text-[#C8E6FA]">
                  <Icon className="w-6 h-6" />
                  {ferramenta.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm leading-relaxed text-[#0e3a6c] dark:text-[#E5F6FF]">
                  {ferramenta.description}
                </p>
                <FeatureIllustration
                  variant={ferramenta.illustration}
                  groups={[]}
                  labs={[]}
                  appearance="surface"
                />
              </CardContent>
            </Card>
          );

          if (ferramenta.external) {
            return (
              <a
                key={ferramenta.id}
                href={ferramenta.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {card}
              </a>
            );
          }

          return (
            <Link key={ferramenta.id} href={ferramenta.href}>
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
