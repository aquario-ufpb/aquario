import {
  Activity,
  BookOpen,
  CalendarDays,
  GitBranch,
  GraduationCap,
  MapPinned,
  type LucideIcon,
} from "lucide-react";

export type NavigationResource = Readonly<{
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  external?: boolean;
}>;

export const NAVIGATION_RESOURCES: readonly NavigationResource[] = [
  {
    href: "/calendario",
    title: "Minhas Disciplinas",
    description: "Organize disciplinas, turmas e horários.",
    icon: CalendarDays,
  },
  {
    href: "/guias",
    title: "Guias",
    description: "Orientações para atravessar o curso.",
    icon: BookOpen,
  },
  {
    href: "/mapas",
    title: "Mapas",
    description: "Encontre salas e laboratórios do CI.",
    icon: MapPinned,
  },
  {
    href: "/grades-curriculares",
    title: "Grades Curriculares",
    description: "Veja requisitos, períodos e equivalências.",
    icon: GitBranch,
  },
  {
    href: "/calendario-academico",
    title: "Calendário Acadêmico",
    description: "Acompanhe datas importantes da UFPB.",
    icon: GraduationCap,
  },
  {
    href: "https://sigaacaiu.com",
    title: "SIGAA Caiu?",
    description: "Veja se o SIGAA UFPB está no ar.",
    icon: Activity,
    external: true,
  },
] as const;

export const SIGAA_MCP_URL = "https://github.com/PucaVaz/sigaa-for-ai-agents";
