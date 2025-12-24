/**
 * Mock for LocalFileGuiasProvider used in tests
 * Bypasses require.context and uses injectable content
 */

import { Guia, Secao, SubSecao } from "@/lib/shared/types";
import { GuiasDataProvider } from "../guias-provider.interface";

export class LocalFileGuiasProvider implements GuiasDataProvider {
  public contentFiles: Record<string, string> = {};

  constructor() {
    // No require.context in tests - content will be injected
  }

  getAll(): Promise<Guia[]> {
    // Find all unique root groups (first-level folders after centro-de-informatica)
    const centroFiles = Object.keys(this.contentFiles).filter(
      key =>
        (key.includes("/centro-de-informatica/") || key.startsWith("./centro-de-informatica/")) &&
        key.endsWith(".md")
    );

    const rootGroups = new Set<string>();
    centroFiles.forEach(filePath => {
      const parts = filePath.split("/").filter(p => p && p !== ".");
      const centroIndex = parts.indexOf("centro-de-informatica");
      // Get the root group (folder right after centro-de-informatica)
      if (centroIndex !== -1 && centroIndex + 1 < parts.length) {
        rootGroups.add(parts[centroIndex + 1]);
      }
    });

    const guias: Guia[] = [];

    rootGroups.forEach(rootGroupFolder => {
      const guiaId = `guia-${this.filenameToSlug(rootGroupFolder)}`;
      const slug = this.filenameToSlug(rootGroupFolder);
      guias.push({
        id: guiaId,
        titulo: this.filenameToTitle(rootGroupFolder),
        slug: slug,
        descricao: `Guia para ${this.filenameToTitle(rootGroupFolder)}`,
        status: "ATIVO",
        cursoId: "centro-de-informatica",
        tags: ["Centro de Informática", this.filenameToTitle(rootGroupFolder)],
      });
    });

    // Sort guias by priority prefix, then alphabetically
    const sortedGuias = this.sortByPriority(guias, guia => {
      // Find the original folder name to check for priority
      const rootGroupsArray = Array.from(rootGroups);
      for (const folder of rootGroupsArray) {
        if (this.filenameToSlug(folder) === guia.slug) {
          return folder;
        }
      }
      return guia.titulo;
    });

    return Promise.resolve(sortedGuias);
  }

  getSecoes(guiaSlug: string): Promise<Secao[]> {
    // Find all .md files directly under the guia folder (not in subfolders)
    const directMdFiles = Object.keys(this.contentFiles).filter(key => {
      const parts = key.split("/").filter(p => p && p !== ".");

      // Check if from centro-de-informatica
      if (!parts.includes("centro-de-informatica")) {
        return false;
      }

      // Find the guia folder in the path
      const guiaFolderIndex = parts.findIndex(p => this.filenameToSlug(p) === guiaSlug);
      if (guiaFolderIndex === -1) {
        return false;
      }

      // Check if this is a direct .md file in the guia folder (not in a subfolder)
      // Path should be: [..., "centro-de-informatica", guiaFolder, "Something.md"]
      const isDirectFile = guiaFolderIndex + 1 === parts.length - 1 && key.endsWith(".md");

      return isDirectFile;
    });

    // Find all folders that contain sub-content (even without a main .md file)
    const foldersWithSubContent = new Set<string>();
    Object.keys(this.contentFiles).forEach(key => {
      const parts = key.split("/").filter(p => p && p !== ".");

      // Check if from centro-de-informatica
      if (!parts.includes("centro-de-informatica")) {
        return;
      }

      // Find the guia folder in the path
      const guiaFolderIndex = parts.findIndex(p => this.filenameToSlug(p) === guiaSlug);
      if (guiaFolderIndex === -1) {
        return;
      }

      // Check if this file is in a subfolder (not direct)
      // Path: [..., "centro-de-informatica", guiaFolder, subfolder, "Something.md"]
      if (guiaFolderIndex + 2 === parts.length - 1 && key.endsWith(".md")) {
        const subfolderName = parts[guiaFolderIndex + 1];
        foldersWithSubContent.add(subfolderName);
      }
    });

    // Collect all section names (from both .md files and folders)
    // IMPORTANT: Only collect sections from the specific guia, not from other guias
    const allSectionNames = new Set<string>();

    // Add sections from direct .md files (already filtered by guia)
    directMdFiles.forEach(filePath => {
      const parts = filePath.split("/").filter(p => p && p !== ".");
      const filename = parts[parts.length - 1];
      const filenameWithoutExt = filename.replace(/\.md$/, "");
      allSectionNames.add(filenameWithoutExt);
    });

    // Add sections from folders with sub-content (already filtered by guia)
    foldersWithSubContent.forEach(folderName => {
      allSectionNames.add(folderName);
    });

    const secoes: Secao[] = [];
    let ordem = 1;

    // Convert Set to Array and sort by priority
    const sortedSectionNames = this.sortByPriority(Array.from(allSectionNames), name => name);

    sortedSectionNames.forEach(sectionName => {
      const slug = this.filenameToSlug(sectionName);
      const titulo = this.filenameToTitle(sectionName); // Remove priority prefix from title

      // Verify this section actually belongs to this guia by checking if we have files/folders for it
      // Check if there's a direct .md file for this section in THIS guia
      const directMdFile = directMdFiles.find(filePath => {
        const parts = filePath.split("/").filter(p => p && p !== ".");
        const filename = parts[parts.length - 1].replace(/\.md$/, "");
        // Match if exact name matches, or if slug matches (handles priority prefixes)
        return filename === sectionName || this.filenameToSlug(filename) === slug;
      });

      // Check if this section folder exists in THIS guia
      const hasFolderInThisGuia = Array.from(foldersWithSubContent).some(
        folderName => folderName === sectionName || this.filenameToSlug(folderName) === slug
      );

      // Skip if this section doesn't belong to this guia
      if (!directMdFile && !hasFolderInThisGuia) {
        return;
      }

      // Get main content from .md file (if it exists)
      let conteudo = directMdFile ? this.contentFiles[directMdFile] : null;

      // Check if there are sub-contents
      // Need to match by both exact name and slug (for priority prefix handling)
      // IMPORTANT: Only match files under the specific guia folder, not from other guias
      const subFiles = Object.keys(this.contentFiles).filter(key => {
        const keyParts = key.split("/").filter(p => p && p !== ".");

        // Check if from centro-de-informatica
        if (!keyParts.includes("centro-de-informatica")) {
          return false;
        }

        // First, find the guia folder in the path
        const guiaFolderIndex = keyParts.findIndex(p => this.filenameToSlug(p) === guiaSlug);
        if (guiaFolderIndex === -1) {
          return false;
        }

        // Then find the section folder - must come AFTER the guia folder
        // Only check parts that come after the guia folder
        const partsAfterGuia = keyParts.slice(guiaFolderIndex + 1);
        if (partsAfterGuia.length < 2) {
          return false; // Need at least [sectionFolder, file.md]
        }

        const sectionFolderName = partsAfterGuia[0];
        // Match by exact name or slug (for priority prefix handling)
        const matchesSection =
          sectionFolderName === sectionName ||
          this.filenameToSlug(sectionFolderName) === this.filenameToSlug(sectionName);

        // The section folder must be directly under the guia folder
        // Path structure: [..., centro-de-informatica, guiaFolder, sectionFolder, file.md]
        return (
          matchesSection &&
          partsAfterGuia.length === 2 && // Exactly [sectionFolder, file.md]
          key.endsWith(".md")
        );
      });

      // If there are sub-contents, add links
      if (subFiles.length > 0) {
        // Sort subFiles by priority before creating links
        const sortedSubFilesForLinks = this.sortByPriority(subFiles, filePath => {
          const subParts = filePath.split("/").filter(p => p && p !== ".");
          const subFilename = subParts[subParts.length - 1].replace(/\.md$/, "");
          return subFilename;
        });

        const subLinks = sortedSubFilesForLinks.map(subFile => {
          const subParts = subFile.split("/").filter(p => p && p !== ".");
          const subFilename = subParts[subParts.length - 1].replace(/\.md$/, "");
          const subDisplayName = this.filenameToTitle(subFilename); // Remove priority prefix
          const subSlug = this.filenameToSlug(subFilename);
          const guiaFolderIndex = subParts.findIndex(p => this.filenameToSlug(p) === guiaSlug);
          const guiaFolder = guiaFolderIndex !== -1 ? subParts[guiaFolderIndex] : guiaSlug;
          const absoluteUrl = `/guias/${this.filenameToSlug(guiaFolder)}/${slug}/${subSlug}`;
          return `- [${subDisplayName}](${absoluteUrl})`;
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

  getSubSecoes(secaoSlug: string): Promise<SubSecao[]> {
    // Find the section name from slug
    // We need to find the folder that corresponds to this secaoSlug
    const allFiles = Object.keys(this.contentFiles);

    // Find a file or folder that matches this secaoSlug
    let secaoFolderName = "";
    for (const filePath of allFiles) {
      const parts = filePath.split("/").filter(p => p && p !== ".");
      // Only check files from centro-de-informatica
      if (!parts.includes("centro-de-informatica")) {
        continue;
      }
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

      // Check if from centro-de-informatica
      if (!parts.includes("centro-de-informatica")) {
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

    // Sort subFiles by priority before processing
    const sortedSubFiles = this.sortByPriority(subFiles, filePath => {
      const parts = filePath.split("/").filter(p => p && p !== ".");
      const filename = parts[parts.length - 1];
      return filename.replace(/\.md$/, "");
    });

    sortedSubFiles.forEach(filePath => {
      const parts = filePath.split("/").filter(p => p && p !== ".");
      const filename = parts[parts.length - 1]; // e.g., "1 - Cálculo I.md" or "Cálculo I.md"
      const filenameWithoutExt = filename.replace(/\.md$/, ""); // "1 - Cálculo I" or "Cálculo I"
      const slug = this.filenameToSlug(filenameWithoutExt);
      const titulo = this.filenameToTitle(filenameWithoutExt); // Remove priority prefix

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
   * Extracts priority and display name from a folder/file name.
   * If name starts with "X - ", X is the priority number.
   * Returns priority number (or Infinity if no prefix) and display name without prefix.
   * Examples:
   *   "1 - Bem Vindo" -> { priority: 1, displayName: "Bem Vindo" }
   *   "10 - Introdução" -> { priority: 10, displayName: "Introdução" }
   *   "Bem Vindo" -> { priority: Infinity, displayName: "Bem Vindo" }
   */
  private extractPriority(name: string): { priority: number; displayName: string } {
    const prefixMatch = name.match(/^(\d+)\s*-\s*(.+)$/);
    if (prefixMatch) {
      const priority = parseInt(prefixMatch[1], 10);
      const displayName = prefixMatch[2].trim();
      return { priority, displayName };
    }
    return { priority: Infinity, displayName: name };
  }

  /**
   * Sorts an array of items by priority (numbered items first, then unnumbered alphabetically).
   * Items with priority numbers come first, sorted by priority.
   * Items without priority come after, sorted alphabetically.
   */
  private sortByPriority<T>(items: T[], getName: (item: T) => string): T[] {
    return [...items].sort((a, b) => {
      const aName = getName(a);
      const bName = getName(b);
      const aPriority = this.extractPriority(aName);
      const bPriority = this.extractPriority(bName);

      // If both have numeric priorities, sort by priority
      if (aPriority.priority !== Infinity && bPriority.priority !== Infinity) {
        return aPriority.priority - bPriority.priority;
      }

      // If only one has priority, it comes first
      if (aPriority.priority !== Infinity) {
        return -1;
      }
      if (bPriority.priority !== Infinity) {
        return 1;
      }

      // Both have no priority, sort alphabetically by display name
      return aPriority.displayName.localeCompare(bPriority.displayName);
    });
  }

  /**
   * Converts a filename or folder name to a URL-friendly slug
   * Examples:
   *   "Sobre o Curso" -> "sobre-o-curso"
   *   "Cálculo I" -> "calculo-i"
   *   "bem-vindo" -> "bem-vindo"
   *   "1 - Bem Vindo" -> "bem-vindo" (prefix removed before slug conversion)
   */
  private filenameToSlug(name: string): string {
    // Remove priority prefix before converting to slug
    const { displayName } = this.extractPriority(name);
    return displayName
      .toLowerCase()
      .normalize("NFD") // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  }

  /**
   * Converts a filename or folder name to a display title
   * Removes priority prefix if present (e.g., "1 - Bem Vindo" -> "Bem Vindo")
   * For folders that are already slugs (like "bem-vindo" or "cadeiras"), capitalize each word
   * For nice names (like "Sobre o Curso"), keep as is
   * Examples:
   *   "1 - Bem Vindo" -> "Bem Vindo"
   *   "10 - Introdução" -> "Introdução"
   *   "bem-vindo" -> "Bem Vindo"
   *   "cadeiras" -> "Cadeiras"
   *   "Sobre o Curso" -> "Sobre o Curso"
   */
  private filenameToTitle(name: string): string {
    // Remove priority prefix if present
    const { displayName } = this.extractPriority(name);

    // If it has spaces, it's already a nice name - keep as is
    if (displayName.includes(" ")) {
      return displayName;
    }

    // Otherwise, it's a slug - convert to title case
    // Handle both hyphenated slugs and single-word slugs
    return displayName
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}
