import type { SearchResultPagina } from "@/lib/shared/types/search.types";

type StaticPage = {
  id: string;
  titulo: string;
  descricao: string;
  url: string;
};

const STATIC_PAGES: StaticPage[] = [
  {
    id: "sobre",
    titulo: "Sobre o Aquario",
    descricao: "Entenda o proposito e visao do Aquario",
    url: "/sobre",
  },
  {
    id: "mapas",
    titulo: "Mapas do Campus",
    descricao: "Visualize mapas, predios e laboratorios da UFPB",
    url: "/mapas",
  },
  {
    id: "recursos",
    titulo: "Recursos",
    descricao: "Disciplinas, guias, mapas, grades e calendario academico",
    url: "/recursos",
  },
  {
    id: "calendario-academico",
    titulo: "Calendario Academico",
    descricao: "Datas importantes do semestre letivo da UFPB",
    url: "/calendario-academico",
  },
  {
    id: "grades-curriculares",
    titulo: "Grades Curriculares",
    descricao: "Consulte grades curriculares dos cursos",
    url: "/grades-curriculares",
  },
  {
    id: "calendario",
    titulo: "Minhas Disciplinas",
    descricao: "Gerencie suas disciplinas e horarios do semestre",
    url: "/calendario",
  },
  {
    id: "entidades",
    titulo: "Entidades",
    descricao: "Laboratorios, grupos de pesquisa, ligas academicas e centros academicos",
    url: "/entidades",
  },
  {
    id: "guias",
    titulo: "Guias",
    descricao: "Documentacao e tutoriais para estudantes",
    url: "/guias",
  },
  {
    id: "vagas",
    titulo: "Vagas",
    descricao: "Estagios, pesquisa e oportunidades para estudantes",
    url: "/vagas",
  },
  {
    id: "projetos",
    titulo: "Projetos",
    descricao: "Projetos de pesquisa, extensao e iniciativas estudantis da UFPB",
    url: "/projetos",
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function searchStaticPages(query: string, limit: number): SearchResultPagina[] {
  const normalizedQuery = normalize(query);

  return STATIC_PAGES.filter(page => {
    const haystack = normalize(`${page.titulo} ${page.descricao}`);
    return haystack.includes(normalizedQuery);
  })
    .slice(0, limit)
    .map(page => ({
      kind: "pagina" as const,
      id: page.id,
      titulo: page.titulo,
      descricao: page.descricao,
      url: page.url,
    }));
}
