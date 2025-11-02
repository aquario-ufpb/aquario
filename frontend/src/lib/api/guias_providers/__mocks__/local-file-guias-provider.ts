/**
 * Mock for LocalFileGuiasProvider used in tests
 * Bypasses require.context and uses injectable content
 */

import { Guia, Secao, SubSecao } from "../../../types";
import { GuiasDataProvider } from "../guias-provider.interface";

export class LocalFileGuiasProvider implements GuiasDataProvider {
  public contentFiles: Record<string, string> = {};

  constructor() {
    // No require.context in tests - content will be injected
  }

  getByCurso(cursoSlug: string): Promise<Guia[]> {
    // Find all unique root groups (first-level folders after curso)
    const courseFiles = Object.keys(this.contentFiles).filter(
      key =>
        (key.includes(`/${cursoSlug}/`) || key.startsWith(`./${cursoSlug}/`)) && key.endsWith(".md")
    );

    const rootGroups = new Set<string>();
    courseFiles.forEach(filePath => {
      const parts = filePath.split("/").filter(p => p && p !== ".");
      const cursoIndex = parts.indexOf(cursoSlug);
      // Get the root group (folder right after curso)
      if (cursoIndex !== -1 && cursoIndex + 1 < parts.length) {
        rootGroups.add(parts[cursoIndex + 1]);
      }
    });

    const guias: Guia[] = [];
    const cursoName = this.filenameToTitle(cursoSlug);

    rootGroups.forEach(rootGroupFolder => {
      const guiaId = `guia-${this.filenameToSlug(rootGroupFolder)}`;
      const slug = this.filenameToSlug(rootGroupFolder);
      guias.push({
        id: guiaId,
        titulo: this.filenameToTitle(rootGroupFolder),
        slug: slug,
        descricao: `Guia para ${this.filenameToTitle(rootGroupFolder)}`,
        status: "ATIVO",
        cursoId: cursoSlug,
        tags: [cursoName, this.filenameToTitle(rootGroupFolder)],
      });
    });

    return Promise.resolve(guias);
  }

  getSecoes(guiaSlug: string, cursoSlug?: string): Promise<Secao[]> {
    // Find all .md files directly under the guia folder (not in subfolders)
    const directMdFiles = Object.keys(this.contentFiles).filter(key => {
      const parts = key.split("/").filter(p => p && p !== ".");

      // Check if from correct course
      const isFromCorrectCourse = !cursoSlug || parts.includes(cursoSlug);
      if (!isFromCorrectCourse) {
        return false;
      }

      // Find the guia folder in the path
      const guiaFolderIndex = parts.findIndex(p => this.filenameToSlug(p) === guiaSlug);
      if (guiaFolderIndex === -1) {
        return false;
      }

      // Check if this is a direct .md file in the guia folder (not in a subfolder)
      // Path should be: [..., guiaFolder, "Something.md"]
      const isDirectFile = guiaFolderIndex + 1 === parts.length - 1 && key.endsWith(".md");

      return isDirectFile;
    });

    // Find all folders that contain sub-content (even without a main .md file)
    const foldersWithSubContent = new Set<string>();
    Object.keys(this.contentFiles).forEach(key => {
      const parts = key.split("/").filter(p => p && p !== ".");

      // Check if from correct course
      const isFromCorrectCourse = !cursoSlug || parts.includes(cursoSlug);
      if (!isFromCorrectCourse) {
        return;
      }

      // Find the guia folder in the path
      const guiaFolderIndex = parts.findIndex(p => this.filenameToSlug(p) === guiaSlug);
      if (guiaFolderIndex === -1) {
        return;
      }

      // Check if this file is in a subfolder (not direct)
      // Path: [..., guiaFolder, subfolder, "Something.md"]
      if (guiaFolderIndex + 2 === parts.length - 1 && key.endsWith(".md")) {
        const subfolderName = parts[guiaFolderIndex + 1];
        foldersWithSubContent.add(subfolderName);
      }
    });

    // Collect all section names (from both .md files and folders)
    const allSectionNames = new Set<string>();

    // Add sections from direct .md files
    directMdFiles.forEach(filePath => {
      const parts = filePath.split("/").filter(p => p && p !== ".");
      const filename = parts[parts.length - 1];
      const filenameWithoutExt = filename.replace(/\.md$/, "");
      allSectionNames.add(filenameWithoutExt);
    });

    // Add sections from folders with sub-content
    foldersWithSubContent.forEach(folderName => {
      allSectionNames.add(folderName);
    });

    const secoes: Secao[] = [];
    let ordem = 1;

    allSectionNames.forEach(sectionName => {
      const slug = this.filenameToSlug(sectionName);
      const titulo = sectionName; // Keep the nice title with spaces

      // Check if there's a direct .md file for this section
      const directMdFile = directMdFiles.find(filePath => {
        const parts = filePath.split("/").filter(p => p && p !== ".");
        const filename = parts[parts.length - 1].replace(/\.md$/, "");
        return filename === sectionName;
      });

      // Get main content from .md file (if it exists)
      let conteudo = directMdFile ? this.contentFiles[directMdFile] : null;

      // Check if there are sub-contents
      const subFiles = Object.keys(this.contentFiles).filter(key => {
        const keyParts = key.split("/").filter(p => p && p !== ".");
        const subfolderIndex = keyParts.indexOf(sectionName);
        return (
          subfolderIndex !== -1 &&
          subfolderIndex + 1 === keyParts.length - 1 &&
          key.endsWith(".md") &&
          (!cursoSlug || keyParts.includes(cursoSlug))
        );
      });

      // If there are sub-contents, add links
      if (subFiles.length > 0) {
        const subLinks = subFiles.map(subFile => {
          const subParts = subFile.split("/").filter(p => p && p !== ".");
          const subFilename = subParts[subParts.length - 1].replace(/\.md$/, "");
          const subSlug = this.filenameToSlug(subFilename);
          const guiaFolderIndex = subParts.findIndex(p => this.filenameToSlug(p) === guiaSlug);
          const guiaFolder = guiaFolderIndex !== -1 ? subParts[guiaFolderIndex] : guiaSlug;
          const absoluteUrl = cursoSlug
            ? `/guias/${cursoSlug}/${this.filenameToSlug(guiaFolder)}/${slug}/${subSlug}`
            : subSlug;
          return `- [${subFilename}](${absoluteUrl})`;
        });

        const subContentSection = `\n\n## Conteúdo relacionado\n\n${subLinks.join("\n")}`;

        if (conteudo) {
          // Append to existing content
          conteudo += subContentSection;
        } else {
          // Only sub-content, no main file
          conteudo = `# ${titulo}${subContentSection}`;
        }
      }

      // Find guiaFolder for constructing IDs
      const allFiles = Object.keys(this.contentFiles);
      let guiaFolder = guiaSlug;
      for (const filePath of allFiles) {
        const parts = filePath.split("/").filter(p => p && p !== ".");
        const guiaFolderIndex = parts.findIndex(p => this.filenameToSlug(p) === guiaSlug);
        if (guiaFolderIndex !== -1) {
          guiaFolder = parts[guiaFolderIndex];
          break;
        }
      }

      const secao: Secao = {
        id: `secao-${slug}`,
        guiaId: `guia-${this.filenameToSlug(guiaFolder)}`,
        titulo: titulo,
        slug: slug,
        ordem: ordem++,
        conteudo: conteudo || "# Conteúdo não disponível",
        status: "ATIVO",
      };

      secoes.push(secao);
    });

    return Promise.resolve(secoes);
  }

  getSubSecoes(secaoSlug: string, cursoSlug?: string): Promise<SubSecao[]> {
    // Find the section name from slug
    // We need to find the folder that corresponds to this secaoSlug
    const allFiles = Object.keys(this.contentFiles);

    // Find a file or folder that matches this secaoSlug
    let secaoFolderName = "";
    for (const filePath of allFiles) {
      const parts = filePath.split("/").filter(p => p && p !== ".");
      for (const part of parts) {
        if (this.filenameToSlug(part) === secaoSlug) {
          secaoFolderName = part;
          break;
        }
      }
      if (secaoFolderName) {
        break;
      }
    }

    if (!secaoFolderName) {
      return Promise.resolve([]);
    }

    // Find all .md files inside the subfolder with the same name as the section
    const subFiles = Object.keys(this.contentFiles).filter(key => {
      const parts = key.split("/").filter(p => p && p !== ".");

      // Check if from correct course
      const isFromCorrectCourse = !cursoSlug || parts.includes(cursoSlug);
      if (!isFromCorrectCourse) {
        return false;
      }

      // Find the section folder in the path
      const secaoFolderIndex = parts.indexOf(secaoFolderName);
      if (secaoFolderIndex === -1) {
        return false;
      }

      // Check if this is a direct .md file in the section folder (subsection)
      const isDirectSubFile = secaoFolderIndex + 1 === parts.length - 1 && key.endsWith(".md");

      return isDirectSubFile;
    });

    const subSecoes: SubSecao[] = [];
    let ordem = 1;

    subFiles.forEach(filePath => {
      const parts = filePath.split("/").filter(p => p && p !== ".");
      const filename = parts[parts.length - 1]; // e.g., "Cálculo I.md"
      const filenameWithoutExt = filename.replace(/\.md$/, ""); // "Cálculo I"
      const slug = this.filenameToSlug(filenameWithoutExt);
      const titulo = filenameWithoutExt;

      const subSecao: SubSecao = {
        id: `subsecao-${slug}`,
        secaoId: `secao-${secaoSlug}`,
        titulo: titulo,
        slug: slug,
        ordem: ordem++,
        conteudo: this.contentFiles[filePath] || "# Conteúdo não disponível",
        status: "ATIVO",
      };

      subSecoes.push(subSecao);
    });

    return Promise.resolve(subSecoes);
  }

  getCentros(): Promise<Array<{ id: string; nome: string; sigla: string }>> {
    return Promise.resolve([
      {
        id: "centro-informatica",
        nome: "Centro de Informática",
        sigla: "CI",
      },
    ]);
  }

  getCursos(
    centroSigla: string
  ): Promise<Array<{ id: string; nome: string; centroId: string; realId: string }>> {
    const cursos: Array<{ id: string; nome: string; centroId: string; realId: string }> = [];
    const cursoNames = new Set<string>();

    Object.keys(this.contentFiles).forEach(filePath => {
      const parts = filePath.split("/").filter(p => p && p !== ".");
      if (parts.length > 0) {
        cursoNames.add(parts[0]);
      }
    });

    cursoNames.forEach(cursoName => {
      cursos.push({
        id: cursoName,
        nome: this.filenameToTitle(cursoName),
        centroId: centroSigla.toLowerCase(),
        realId: cursoName,
      });
    });

    return Promise.resolve(cursos);
  }

  /**
   * Converts a filename or folder name to a URL-friendly slug
   * Examples:
   *   "Sobre o Curso" -> "sobre-o-curso"
   *   "Cálculo I" -> "calculo-i"
   *   "bem-vindo" -> "bem-vindo"
   */
  private filenameToSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize("NFD") // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  }

  /**
   * Converts a filename or folder name to a display title
   * For folders that are already slugs (like "bem-vindo" or "cadeiras"), capitalize each word
   * For nice names (like "Sobre o Curso"), keep as is
   * Examples:
   *   "bem-vindo" -> "Bem Vindo"
   *   "cadeiras" -> "Cadeiras"
   *   "Sobre o Curso" -> "Sobre o Curso"
   */
  private filenameToTitle(name: string): string {
    // If it has spaces, it's already a nice name - keep as is
    if (name.includes(" ")) {
      return name;
    }

    // Otherwise, it's a slug - convert to title case
    // Handle both hyphenated slugs and single-word slugs
    return name
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}
