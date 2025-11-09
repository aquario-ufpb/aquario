/**
 * Unit tests for LocalFileGuiasProvider
 * Tests file path parsing, content extraction, and data transformation logic
 */

// Use the manual mock that avoids require.context
jest.mock("../local-file-guias-provider");

const mockContentFiles = {
  // Centro de Informática - Bem Vindo
  "./centro-de-informatica/bem-vindo/Sobre o Curso.md": `# Sobre o Curso
  
Este é o curso de Ciência da Computação.

## Objetivo

Formar profissionais na área de computação.`,

  "./centro-de-informatica/bem-vindo/Grade Curricular.md": `# Grade Curricular

Veja abaixo a grade do curso.`,

  // Centro de Informática - Cadeiras (with sub-contents)
  "./centro-de-informatica/cadeiras/Principais Cadeiras.md": `# Principais Cadeiras

As principais disciplinas do curso.`,

  "./centro-de-informatica/cadeiras/Principais Cadeiras/Cálculo I.md": `# Cálculo I

Disciplina de cálculo diferencial e integral.

## Ementa

- Limites
- Derivadas
- Integrais`,

  "./centro-de-informatica/cadeiras/Principais Cadeiras/Programação I.md": `# Programação I

Introdução à programação.`,

  "./centro-de-informatica/cadeiras/Principais Cadeiras/Estrutura de Dados.md": `# Estrutura de Dados

Estudo de estruturas de dados.`,

  // Centro de Informática - Laboratórios
  "./centro-de-informatica/laboratorios/LAICO.md": `# LAICO

Laboratório de Aplicações de Informática Avançada.`,
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

  describe("getAll", () => {
    it("should return all guias from centro-de-informatica", async () => {
      const guias = await provider.getAll();

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

    it("should include cursoId in guias", async () => {
      const guias = await provider.getAll();

      guias.forEach(guia => {
        expect(guia.cursoId).toBe("centro-de-informatica");
      });
    });

    it("should generate correct IDs with guia- prefix", async () => {
      const guias = await provider.getAll();

      guias.forEach(guia => {
        expect(guia.id).toMatch(/^guia-/);
        expect(guia.id).toBe(`guia-${guia.slug}`);
      });
    });
  });

  describe("getSecoes", () => {
    it("should return sections for bem-vindo guia", async () => {
      const secoes = await provider.getSecoes("bem-vindo");

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
      const secoes = await provider.getSecoes("cadeiras");

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
      expect(principaisCadeiras?.conteudo).toContain("/guias/cadeiras/principais-cadeiras/");
    });

    it("should set correct ordem (order) for sections", async () => {
      const secoes = await provider.getSecoes("bem-vindo");

      secoes.forEach((secao, index) => {
        expect(secao.ordem).toBe(index + 1);
      });
    });

    it("should return empty array for non-existent guia", async () => {
      const secoes = await provider.getSecoes("guia-inexistente");

      expect(secoes).toEqual([]);
    });

    it("should filter sections by guia", async () => {
      const secoes = await provider.getSecoes("bem-vindo");

      // Should only include sections from this guia
      secoes.forEach(secao => {
        expect(secao.guiaId).toBe("guia-bem-vindo");
      });
    });
  });

  describe("getSubSecoes", () => {
    it("should return subsections for principais-cadeiras", async () => {
      const subsecoes = await provider.getSubSecoes("principais-cadeiras");

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
      const subsecoes = await provider.getSubSecoes("principais-cadeiras");

      subsecoes.forEach((subsecao, index) => {
        expect(subsecao.ordem).toBe(index + 1);
      });
    });

    it("should generate correct IDs with subsecao- prefix", async () => {
      const subsecoes = await provider.getSubSecoes("principais-cadeiras");

      subsecoes.forEach(subsecao => {
        expect(subsecao.id).toMatch(/^subsecao-/);
        expect(subsecao.secaoId).toBe("secao-principais-cadeiras");
      });
    });

    it("should return empty array for non-existent section", async () => {
      const subsecoes = await provider.getSubSecoes("secao-inexistente");

      expect(subsecoes).toEqual([]);
    });

    it("should have content for all subsections", async () => {
      const subsecoes = await provider.getSubSecoes("principais-cadeiras");

      subsecoes.forEach(subsecao => {
        expect(subsecao.conteudo).toBeTruthy();
        expect(typeof subsecao.conteudo).toBe("string");
      });
    });
  });

  describe("filenameToTitle and filenameToSlug (via public methods)", () => {
    it("should preserve nice filename titles and generate proper slugs", async () => {
      const guias = await provider.getAll();

      // Folder names (slugs) should be converted to Title Case
      const bemVindo = findGuiaBySlug(guias, "bem-vindo");
      expect(bemVindo?.titulo).toBe("Bem Vindo");

      // File names with nice formatting should be preserved
      const secoes = await provider.getSecoes("bem-vindo");
      const sobreOCurso = findSecaoBySlug(secoes, "sobre-o-curso");
      expect(sobreOCurso?.titulo).toBe("Sobre o Curso"); // From "Sobre o Curso.md"
    });

    it("should normalize accents and special characters in slugs", async () => {
      const subsecoes = await provider.getSubSecoes("principais-cadeiras");

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

      // Should have centro-de-informatica as the course
      const cursoSlugs = cursos.map(c => c.id);
      expect(cursoSlugs).toContain("centro-de-informatica");
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

      const centroInfo = cursos.find(c => c.id === "centro-de-informatica");
      expect(centroInfo?.nome).toBe("Centro De Informatica");
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
      const guias = await provider.getAll();
      expect(guias.length).toBeGreaterThan(0);
    });

    it("should only process .md files", async () => {
      const secoes = await provider.getSecoes("bem-vindo");

      // Should only get sections from .md files
      secoes.forEach(secao => {
        // All sections should have valid slugs from markdown files
        expect(secao.slug).toBeTruthy();
        expect(secao.titulo).toBeTruthy();
        expect(secao.conteudo).toBeTruthy();
      });
    });

    it("should handle filenames with spaces and special characters", async () => {
      const secoes = await provider.getSecoes("bem-vindo");

      // "Sobre o Curso.md" should be parsed correctly
      const sobreOCurso = findSecaoBySlug(secoes, "sobre-o-curso");
      expect(sobreOCurso).toBeDefined();
      expect(sobreOCurso?.titulo).toBe("Sobre o Curso"); // Preserves original formatting
    });
  });
});
