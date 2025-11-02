/**
 * Unit tests for LocalFileGuiasProvider
 * Tests file path parsing, content extraction, and data transformation logic
 */

// Use the manual mock that avoids require.context
jest.mock("../local-file-guias-provider");

const mockContentFiles = {
  // Ciência da Computação - Bem Vindo
  "./ciencia-da-computacao/bem-vindo/Sobre o Curso.md": `# Sobre o Curso
  
Este é o curso de Ciência da Computação.

## Objetivo

Formar profissionais na área de computação.`,

  "./ciencia-da-computacao/bem-vindo/Grade Curricular.md": `# Grade Curricular

Veja abaixo a grade do curso.`,

  // Ciência da Computação - Cadeiras (with sub-contents)
  "./ciencia-da-computacao/cadeiras/Principais Cadeiras.md": `# Principais Cadeiras

As principais disciplinas do curso.`,

  "./ciencia-da-computacao/cadeiras/Principais Cadeiras/Cálculo I.md": `# Cálculo I

Disciplina de cálculo diferencial e integral.

## Ementa

- Limites
- Derivadas
- Integrais`,

  "./ciencia-da-computacao/cadeiras/Principais Cadeiras/Programação I.md": `# Programação I

Introdução à programação.`,

  "./ciencia-da-computacao/cadeiras/Principais Cadeiras/Estrutura de Dados.md": `# Estrutura de Dados

Estudo de estruturas de dados.`,

  // Ciência da Computação - Laboratórios
  "./ciencia-da-computacao/laboratorios/LAICO.md": `# LAICO

Laboratório de Aplicações de Informática Avançada.`,

  // Engenharia da Computação - Bem Vindo
  "./engenharia-da-computacao/bem-vindo/Sobre o Curso.md": `# Engenharia da Computação

Curso de engenharia focado em hardware e software.`,

  // Engenharia da Computação - Cadeiras (with sub-contents)
  "./engenharia-da-computacao/cadeiras/Principais Cadeiras.md": `# Principais Cadeiras

Disciplinas fundamentais da engenharia.`,

  "./engenharia-da-computacao/cadeiras/Principais Cadeiras/Circuitos Digitais.md": `# Circuitos Digitais

Estudo de circuitos lógicos.`,

  // Ciências de Dados e IA - Bem Vindo
  "./ciencias-de-dados-e-inteligencia-artificial/bem-vindo/Sobre o Curso.md": `# Ciências de Dados e IA

Curso focado em análise de dados e inteligência artificial.`,

  // Ciências de Dados e IA - Cadeiras (with sub-contents)
  "./ciencias-de-dados-e-inteligencia-artificial/cadeiras/Principais Cadeiras.md": `# Principais Cadeiras

As disciplinas essenciais do curso.`,

  "./ciencias-de-dados-e-inteligencia-artificial/cadeiras/Principais Cadeiras/Machine Learning.md": `# Machine Learning

Introdução ao aprendizado de máquina.`,
};

import { LocalFileGuiasProvider } from "../local-file-guias-provider";
import {
  assertValidGuia,
  assertValidSecao,
  assertValidSubSecao,
  findGuiaBySlug,
  findSecaoBySlug,
} from "../../../../__tests__/utils/guias-test-helpers";

describe("LocalFileGuiasProvider", () => {
  let provider: LocalFileGuiasProvider;

  beforeEach(() => {
    // Create a new instance and inject mock data
    provider = new LocalFileGuiasProvider();
    // The mock version has public contentFiles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (provider as any).contentFiles = mockContentFiles;
  });

  describe("getByCurso", () => {
    it("should return guias for ciencia-da-computacao", async () => {
      const guias = await provider.getByCurso("ciencia-da-computacao");

      expect(guias.length).toBeGreaterThan(0);
      guias.forEach(assertValidGuia);

      // Check if we have the expected guias
      const bemVindo = findGuiaBySlug(guias, "bem-vindo");
      const cadeiras = findGuiaBySlug(guias, "cadeiras");
      const laboratorios = findGuiaBySlug(guias, "laboratorios");

      expect(bemVindo).toBeDefined();
      expect(cadeiras).toBeDefined();
      expect(laboratorios).toBeDefined();

      expect(bemVindo?.titulo).toBe("Bem Vindo");
      expect(cadeiras?.titulo).toBe("Cadeiras");
    });

    it("should return guias for engenharia-da-computacao", async () => {
      const guias = await provider.getByCurso("engenharia-da-computacao");

      expect(guias.length).toBeGreaterThan(0);
      guias.forEach(assertValidGuia);

      const bemVindo = findGuiaBySlug(guias, "bem-vindo");
      expect(bemVindo).toBeDefined();
    });

    it("should return guias for ciencias-de-dados-e-inteligencia-artificial", async () => {
      const guias = await provider.getByCurso("ciencias-de-dados-e-inteligencia-artificial");

      expect(guias.length).toBeGreaterThan(0);
      guias.forEach(assertValidGuia);
    });

    it("should return empty array for non-existent course", async () => {
      const guias = await provider.getByCurso("curso-inexistente");

      expect(guias).toEqual([]);
    });

    it("should include cursoId in guias", async () => {
      const guias = await provider.getByCurso("ciencia-da-computacao");

      guias.forEach(guia => {
        expect(guia.cursoId).toBe("ciencia-da-computacao");
      });
    });

    it("should generate correct IDs with guia- prefix", async () => {
      const guias = await provider.getByCurso("ciencia-da-computacao");

      guias.forEach(guia => {
        expect(guia.id).toMatch(/^guia-/);
        expect(guia.id).toBe(`guia-${guia.slug}`);
      });
    });
  });

  describe("getSecoes", () => {
    it("should return sections for bem-vindo guia", async () => {
      const secoes = await provider.getSecoes("bem-vindo", "ciencia-da-computacao");

      expect(secoes.length).toBeGreaterThan(0);
      secoes.forEach(assertValidSecao);

      const sobreOCurso = findSecaoBySlug(secoes, "sobre-o-curso");
      const gradeCurricular = findSecaoBySlug(secoes, "grade-curricular");

      expect(sobreOCurso).toBeDefined();
      expect(gradeCurricular).toBeDefined();

      expect(sobreOCurso?.titulo).toBe("Sobre o Curso");
      expect(sobreOCurso?.conteudo).toContain("Ciência da Computação");
    });

    it("should append sub-content links to sections with subsections", async () => {
      const secoes = await provider.getSecoes("cadeiras", "ciencia-da-computacao");

      expect(secoes.length).toBeGreaterThan(0);

      const principaisCadeiras = findSecaoBySlug(secoes, "principais-cadeiras");
      expect(principaisCadeiras).toBeDefined();

      // Should have main content plus auto-generated sub-content links
      expect(principaisCadeiras?.conteudo).toContain("Principais Cadeiras");
      expect(principaisCadeiras?.conteudo).toContain("Conteúdo relacionado");
      expect(principaisCadeiras?.conteudo).toContain("Cálculo I");
      expect(principaisCadeiras?.conteudo).toContain("Programação I");
      expect(principaisCadeiras?.conteudo).toContain("Estrutura de Dados");

      // Should have absolute URLs
      expect(principaisCadeiras?.conteudo).toContain(
        "/guias/ciencia-da-computacao/cadeiras/principais-cadeiras/"
      );
    });

    it("should set correct ordem (order) for sections", async () => {
      const secoes = await provider.getSecoes("bem-vindo", "ciencia-da-computacao");

      secoes.forEach((secao, index) => {
        expect(secao.ordem).toBe(index + 1);
      });
    });

    it("should return empty array for non-existent guia", async () => {
      const secoes = await provider.getSecoes("guia-inexistente", "ciencia-da-computacao");

      expect(secoes).toEqual([]);
    });

    it("should filter by course when cursoSlug is provided", async () => {
      const secoes = await provider.getSecoes("bem-vindo", "ciencia-da-computacao");

      // Should not include sections from other courses
      secoes.forEach(secao => {
        expect(secao.guiaId).toBe("guia-bem-vindo");
      });
    });
  });

  describe("getSubSecoes", () => {
    it("should return subsections for principais-cadeiras", async () => {
      const subsecoes = await provider.getSubSecoes("principais-cadeiras", "ciencia-da-computacao");

      expect(subsecoes.length).toBeGreaterThan(0);
      subsecoes.forEach(assertValidSubSecao);

      const calculoI = subsecoes.find(s => s.slug === "calculo-i");
      const programacaoI = subsecoes.find(s => s.slug === "programacao-i");
      const estruturaDados = subsecoes.find(s => s.slug === "estrutura-de-dados");

      expect(calculoI).toBeDefined();
      expect(programacaoI).toBeDefined();
      expect(estruturaDados).toBeDefined();

      expect(calculoI?.titulo).toBe("Cálculo I");
      expect(calculoI?.conteudo).toContain("Cálculo I");
      expect(calculoI?.conteudo).toContain("Limites");
    });

    it("should set correct ordem for subsections", async () => {
      const subsecoes = await provider.getSubSecoes("principais-cadeiras", "ciencia-da-computacao");

      subsecoes.forEach((subsecao, index) => {
        expect(subsecao.ordem).toBe(index + 1);
      });
    });

    it("should generate correct IDs with subsecao- prefix", async () => {
      const subsecoes = await provider.getSubSecoes("principais-cadeiras", "ciencia-da-computacao");

      subsecoes.forEach(subsecao => {
        expect(subsecao.id).toMatch(/^subsecao-/);
        expect(subsecao.secaoId).toBe("secao-principais-cadeiras");
      });
    });

    it("should return empty array for non-existent section", async () => {
      const subsecoes = await provider.getSubSecoes("secao-inexistente", "ciencia-da-computacao");

      expect(subsecoes).toEqual([]);
    });

    it("should have content for all subsections", async () => {
      const subsecoes = await provider.getSubSecoes("principais-cadeiras", "ciencia-da-computacao");

      subsecoes.forEach(subsecao => {
        expect(subsecao.conteudo).toBeTruthy();
        expect(typeof subsecao.conteudo).toBe("string");
      });
    });
  });

  describe("filenameToTitle and filenameToSlug (via public methods)", () => {
    it("should preserve nice filename titles and generate proper slugs", async () => {
      const guias = await provider.getByCurso("ciencia-da-computacao");

      // Folder names (slugs) should be converted to Title Case
      const bemVindo = findGuiaBySlug(guias, "bem-vindo");
      expect(bemVindo?.titulo).toBe("Bem Vindo");

      // File names with nice formatting should be preserved
      const secoes = await provider.getSecoes("bem-vindo", "ciencia-da-computacao");
      const sobreOCurso = findSecaoBySlug(secoes, "sobre-o-curso");
      expect(sobreOCurso?.titulo).toBe("Sobre o Curso"); // From "Sobre o Curso.md"
    });

    it("should normalize accents and special characters in slugs", async () => {
      const subsecoes = await provider.getSubSecoes("principais-cadeiras", "ciencia-da-computacao");

      // "Cálculo I.md" should have slug "calculo-i"
      const calculoI = subsecoes.find(s => s.slug === "calculo-i");
      expect(calculoI).toBeDefined();
      expect(calculoI?.titulo).toBe("Cálculo I"); // Title keeps accents
    });
  });

  describe("getCursos", () => {
    it("should extract unique courses from root level", async () => {
      const cursos = await provider.getCursos("CI");

      expect(cursos.length).toBeGreaterThan(0);

      // Should have all three courses
      const cursoSlugs = cursos.map(c => c.id);
      expect(cursoSlugs).toContain("ciencia-da-computacao");
      expect(cursoSlugs).toContain("engenharia-da-computacao");
      expect(cursoSlugs).toContain("ciencias-de-dados-e-inteligencia-artificial");
    });

    it("should set correct course properties", async () => {
      const cursos = await provider.getCursos("CI");

      cursos.forEach(curso => {
        expect(curso).toHaveProperty("id");
        expect(curso).toHaveProperty("nome");
        expect(curso).toHaveProperty("centroId");
        expect(curso).toHaveProperty("realId");
        expect(curso.centroId).toBe("ci");
        expect(curso.realId).toBe(curso.id);
      });
    });

    it("should convert slugs to readable names", async () => {
      const cursos = await provider.getCursos("CI");

      const cienciaComp = cursos.find(c => c.id === "ciencia-da-computacao");
      expect(cienciaComp?.nome).toBe("Ciencia Da Computacao");
    });
  });

  describe("getCentros", () => {
    it("should return default centro", async () => {
      const centros = await provider.getCentros();

      expect(centros).toHaveLength(1);
      expect(centros[0]).toEqual({
        id: "centro-informatica",
        nome: "Centro de Informática",
        sigla: "CI",
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle paths with leading ./ correctly", async () => {
      const guias = await provider.getByCurso("ciencia-da-computacao");
      expect(guias.length).toBeGreaterThan(0);
    });

    it("should only process .md files", async () => {
      const secoes = await provider.getSecoes("bem-vindo", "ciencia-da-computacao");

      // Should only get sections from .md files
      secoes.forEach(secao => {
        // All sections should have valid slugs from markdown files
        expect(secao.slug).toBeTruthy();
        expect(secao.titulo).toBeTruthy();
        expect(secao.conteudo).toBeTruthy();
      });
    });

    it("should handle filenames with spaces and special characters", async () => {
      const secoes = await provider.getSecoes("bem-vindo", "ciencia-da-computacao");

      // "Sobre o Curso.md" should be parsed correctly
      const sobreOCurso = findSecaoBySlug(secoes, "sobre-o-curso");
      expect(sobreOCurso).toBeDefined();
      expect(sobreOCurso?.titulo).toBe("Sobre o Curso"); // Preserves original formatting
    });
  });
});
