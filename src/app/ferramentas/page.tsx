import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CalendarDays, Map, BookOpen, GitBranch } from "lucide-react";

const ferramentas = [
  {
    id: "calendario",
    title: "Minhas Disciplinas",
    description:
      "Gerencie suas disciplinas cursando, escolha turmas e visualize seu calendário personalizado. Busque por código, nome, professor ou localização.",
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
    id: "grades",
    title: "Grades Curriculares",
    description:
      "Visualize a grade curricular do seu curso de forma interativa. Veja disciplinas por período, pré-requisitos e equivalências em um grafo visual.",
    href: "/grades-curriculares",
    icon: GitBranch,
    imagePath: "/grade",
  },
  {
    id: "calendario-academico",
    title: "Calendário Acadêmico",
    description:
      "Visualize os eventos e datas importantes do calendário acadêmico da UFPB. Consulte períodos de matrícula, feriados, exames finais e mais.",
    href: "/calendario-academico",
    icon: CalendarDays,
    imagePath: null,
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

export default function FerramentasPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl mt-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-[#0e3a6c] dark:text-[#C8E6FA]">
          Ferramentas
        </h1>
        <p className="text-lg md:text-xl text-[#0e3a6c] dark:text-[#E5F6FF]">
          Ferramentas úteis para estudantes do Centro de Informática
        </p>
      </div>

      {/* Ferramentas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ferramentas.map(ferramenta => {
          const Icon = ferramenta.icon;
          return (
            <Link key={ferramenta.id} href={ferramenta.href}>
              <Card className="h-full transition-all hover:shadow-lg cursor-pointer bg-white border-slate-200 hover:border-slate-300 dark:bg-white/5 dark:border-white/20 dark:hover:bg-white/10">
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
                  {ferramenta.imagePath && (
                    <div className="mt-auto">
                      <Image
                        src={`${ferramenta.imagePath}/light.png`}
                        alt={ferramenta.title}
                        width={300}
                        height={150}
                        className="w-full h-auto object-contain rounded-lg shadow-md dark:hidden"
                      />
                      <Image
                        src={`${ferramenta.imagePath}/dark.png`}
                        alt={ferramenta.title}
                        width={300}
                        height={150}
                        className="w-full h-auto object-contain rounded-lg shadow-md hidden dark:block"
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
