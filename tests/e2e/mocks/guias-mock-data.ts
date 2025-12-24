/**
 * Mock data for E2E tests - Guias module
 * These mocks simulate API responses for consistent E2E testing
 */

export const mockGuiasE2E = {
  cursos: [
    {
      id: "ciencia-da-computacao",
      nome: "Ciência da Computação",
      centroId: "ci",
    },
    {
      id: "engenharia-da-computacao",
      nome: "Engenharia da Computação",
      centroId: "ci",
    },
  ],

  guias: {
    "ciencia-da-computacao": [
      {
        id: "guia-bem-vindo",
        titulo: "Bem Vindo",
        slug: "bem-vindo",
        descricao: "Guia de boas-vindas ao curso",
        status: "ATIVO",
        cursoId: "ciencia-da-computacao",
        tags: ["CC", "Introdução"],
      },
      {
        id: "guia-cadeiras",
        titulo: "Cadeiras",
        slug: "cadeiras",
        descricao: "Guia sobre as disciplinas do curso",
        status: "ATIVO",
        cursoId: "ciencia-da-computacao",
        tags: ["CC", "Disciplinas"],
      },
    ],
  },

  secoes: {
    "bem-vindo": [
      {
        id: "secao-sobre",
        guiaId: "guia-bem-vindo",
        titulo: "Sobre O Curso",
        slug: "sobre-o-curso",
        ordem: 1,
        conteudo: `# Sobre o Curso de Ciência da Computação

O curso de Ciência da Computação forma profissionais capacitados para atuar no desenvolvimento de software, análise de sistemas e pesquisa científica.

## Objetivo

Formar profissionais com sólida base teórica e prática em computação.

## Duração

O curso tem duração de 4 anos (8 períodos).`,
        status: "ATIVO",
      },
      {
        id: "secao-grade",
        guiaId: "guia-bem-vindo",
        titulo: "Grade Curricular",
        slug: "grade-curricular",
        ordem: 2,
        conteudo: `# Grade Curricular

Veja abaixo a estrutura do curso.

## Períodos

- 1º Período: Introdução, Cálculo I, Programação I
- 2º Período: Cálculo II, Estrutura de Dados, POO`,
        status: "ATIVO",
      },
    ],
    cadeiras: [
      {
        id: "secao-principais",
        guiaId: "guia-cadeiras",
        titulo: "Principais Cadeiras",
        slug: "principais-cadeiras",
        ordem: 1,
        conteudo: null, // Will show auto-index
        status: "ATIVO",
      },
    ],
  },

  subsecoes: {
    "principais-cadeiras": [
      {
        id: "subsecao-calculo",
        secaoId: "secao-principais",
        titulo: "Cálculo I",
        slug: "calculo-I",
        ordem: 1,
        conteudo: `# Cálculo I

Disciplina fundamental para o curso.

## Ementa

- Limites
- Derivadas
- Integrais
- Aplicações

## Dicas

Esta é uma disciplina importante. Dedique tempo aos estudos!`,
        status: "ATIVO",
      },
      {
        id: "subsecao-prog",
        secaoId: "secao-principais",
        titulo: "Programação I",
        slug: "programacao-I",
        ordem: 2,
        conteudo: `# Programação I

Introdução à programação de computadores.

## Ementa

- Algoritmos
- Estruturas de controle
- Funções
- Listas e arrays

## Linguagem

Geralmente utiliza Python ou C.`,
        status: "ATIVO",
      },
    ],
  },
};

/**
 * Helper to get mock response by endpoint pattern
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMockResponseForEndpoint(url: string): any {
  // Extract curso from URL
  const cursoMatch = url.match(/\/guias\/([^/]+)/);
  const guiaMatch = url.match(/\/guias\/[^/]+\/([^/]+)/);
  const secaoMatch = url.match(/\/guias\/[^/]+\/[^/]+\/([^/]+)/);

  if (secaoMatch && url.includes("/subsecoes")) {
    const secaoSlug = secaoMatch[1];
    return mockGuiasE2E.subsecoes[secaoSlug as keyof typeof mockGuiasE2E.subsecoes] || [];
  }

  if (guiaMatch && url.includes("/secoes")) {
    const guiaSlug = guiaMatch[1];
    return mockGuiasE2E.secoes[guiaSlug as keyof typeof mockGuiasE2E.secoes] || [];
  }

  if (cursoMatch && url.includes("/guias")) {
    const cursoSlug = cursoMatch[1];
    return mockGuiasE2E.guias[cursoSlug as keyof typeof mockGuiasE2E.guias] || [];
  }

  return null;
}
