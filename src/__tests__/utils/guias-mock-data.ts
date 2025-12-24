/**
 * Mock file context data simulating the aquario-guias folder structure
 * Used for testing LocalFileGuiasProvider without requiring actual files
 */

export const mockContentFiles: Record<string, string> = {
  // Ciência da Computação - Bem Vindo
  "./ciencia-da-computacao/bem-vindo/sobre-o-curso/content.md": `# Sobre o Curso
  
Este é o curso de Ciência da Computação.

## Objetivo

Formar profissionais na área de computação.`,

  "./ciencia-da-computacao/bem-vindo/grade-curricular/content.md": `# Grade Curricular

Veja abaixo a grade do curso.`,

  // Ciência da Computação - Cadeiras (with subsections, no direct content.md)
  "./ciencia-da-computacao/cadeiras/principais-cadeiras/calculo-I/content.md": `# Cálculo I

Disciplina de cálculo diferencial e integral.

## Ementa

- Limites
- Derivadas
- Integrais`,

  "./ciencia-da-computacao/cadeiras/principais-cadeiras/programacao-I/content.md": `# Programação I

Introdução à programação.`,

  "./ciencia-da-computacao/cadeiras/principais-cadeiras/estrutura-dados/content.md": `# Estrutura de Dados

Estudo de estruturas de dados.`,

  // Ciência da Computação - Laboratórios
  "./ciencia-da-computacao/laboratorios/laico/content.md": `# LAICO

Laboratório de Aplicações de Informática Avançada.`,

  // Engenharia da Computação
  "./engenharia-da-computacao/bem-vindo/sobre-o-curso/content.md": `# Engenharia da Computação

Curso de engenharia focado em hardware e software.`,

  "./engenharia-da-computacao/cadeiras/principais-cadeiras/circuitos-digitais/content.md": `# Circuitos Digitais

Estudo de circuitos lógicos.`,

  // Ciências de Dados e IA
  "./ciencias-de-dados-e-inteligencia-artificial/bem-vindo/sobre-o-curso/content.md": `# Ciências de Dados e IA

Curso focado em análise de dados e inteligência artificial.`,

  "./ciencias-de-dados-e-inteligencia-artificial/cadeiras/principais-cadeiras/machine-learning/content.md": `# Machine Learning

Introdução ao aprendizado de máquina.`,
};

/**
 * Helper to get all file keys (paths) from mock data
 */
export const getMockFileKeys = (): string[] => {
  return Object.keys(mockContentFiles);
};

/**
 * Helper to filter mock files by pattern
 */
export const filterMockFilesByPattern = (pattern: string): string[] => {
  return getMockFileKeys().filter(key => key.includes(pattern));
};
