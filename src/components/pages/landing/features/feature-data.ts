import { BookOpen, CalendarDays, FlaskConical, GitBranch, MapIcon, UsersRound } from "lucide-react";
import type { LandingFeature } from "./types";

export const landingFeatures: LandingFeature[] = [
  {
    title: "Mapas",
    description: "Encontre salas, laboratórios e espaços importantes do Centro de Informática.",
    href: "/mapas",
    icon: MapIcon,
    illustration: "map",
  },
  {
    title: "Grupos",
    description:
      "Descubra iniciativas, ligas e comunidades para construir junto com outras pessoas.",
    href: "/entidades",
    icon: UsersRound,
    illustration: "groups",
  },
  {
    title: "Horários",
    description: "Organize suas aulas, atividades e compromissos de forma prática e personalizada.",
    href: "/calendario",
    icon: CalendarDays,
    illustration: "schedule",
  },
  {
    title: "Grades e Disciplinas",
    description:
      "Entenda a grade do curso, acompanhe disciplinas e veja pré-requisitos com clareza.",
    href: "/grades-curriculares",
    icon: GitBranch,
    illustration: "curriculum",
  },
  {
    title: "Laboratórios",
    description: "Conheça laboratórios do CI e veja onde eles aparecem dentro do mapa do campus.",
    href: "/entidades",
    icon: FlaskConical,
    illustration: "labs",
  },
  {
    title: "Veja todos os recursos",
    description: "Acesse a lista completa de ferramentas, guias e páginas úteis do Aquário.",
    href: "/ferramentas",
    icon: BookOpen,
    illustration: "guides",
  },
];
