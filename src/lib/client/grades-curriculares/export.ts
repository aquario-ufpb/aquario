import { toBlob } from "html-to-image";

type ExportGradeOptions = {
  /** The inner graph container element to capture */
  graphElement: HTMLElement;
  /** Course name for the filename */
  cursoNome: string;
  /** Curriculum code for the filename */
  curriculoCodigo: string;
};

/**
 * Exports the curriculum grade visualization as a PNG image.
 * Expects the scroll container to already be expanded by the caller
 * (so the full grade is visible for capture).
 */
export async function exportGradeAsImage({
  graphElement,
  cursoNome,
  curriculoCodigo,
}: ExportGradeOptions): Promise<void> {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  const blob = await toBlob(graphElement, {
    pixelRatio,
    backgroundColor: getComputedStyle(graphElement).backgroundColor || "#ffffff",
  });

  if (!blob) {
    throw new Error("Falha ao gerar a imagem da grade curricular");
  }

  const sanitizedName = cursoNome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `grade-${sanitizedName}-${curriculoCodigo}.png`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 200);
}
