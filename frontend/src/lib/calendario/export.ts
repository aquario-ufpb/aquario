import domtoimage from "dom-to-image";

/**
 * Exports a calendar element as a PNG image
 * @param element - The HTML element to export
 * @param filename - The filename for the downloaded image (default: "calendario.png")
 * @param backgroundColor - Optional background color (default: white)
 * @returns Promise that resolves when the export is complete
 */
export async function exportCalendarAsImage(
  element: HTMLElement,
  filename: string = "calendario.png",
  backgroundColor: string | null = "#ffffff"
): Promise<void> {
  if (!element) {
    throw new Error("Elemento não encontrado para exportação");
  }

  try {
    console.log("Starting export...", { element, filename, backgroundColor });

    // Ensure horizontal borders are visible for export
    // Add border-bottom to all table rows to ensure horizontal lines are visible
    const rows = element.querySelectorAll("tr");
    const originalBorders: Array<{ element: HTMLElement; borderBottom: string }> = [];

    rows.forEach(row => {
      if (row instanceof HTMLElement) {
        // Store original border
        originalBorders.push({
          element: row,
          borderBottom: row.style.borderBottom,
        });
        // Add explicit border-bottom for horizontal lines
        const borderColor = backgroundColor === "#0f2338" ? "rgba(255,255,255,0.1)" : "#e2e8f0";
        row.style.borderBottom = `1px solid ${borderColor}`;
      }
    });

    // Also ensure table has proper border styling
    const tables = element.querySelectorAll("table");
    tables.forEach(table => {
      if (table instanceof HTMLElement) {
        const borderColor = backgroundColor === "#0f2338" ? "rgba(255,255,255,0.1)" : "#e2e8f0";
        if (!table.style.border) {
          table.style.border = `1px solid ${borderColor}`;
        }
      }
    });

    // Use dom-to-image to convert element to PNG
    // dom-to-image handles complex layouts, sticky positioning, and merged cells well
    const dataUrl = await domtoimage.toPng(element, {
      quality: 1.0,
      bgcolor: backgroundColor || "#ffffff",
      width: element.scrollWidth,
      height: element.scrollHeight,
    });

    // Restore original borders
    originalBorders.forEach(({ element: row, borderBottom }) => {
      row.style.borderBottom = borderBottom;
    });

    console.log("Image created, starting download...");

    // Create download link
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();

    // Clean up after a short delay
    setTimeout(() => {
      document.body.removeChild(link);
      console.log("Export completed successfully");
    }, 200);
  } catch (error) {
    console.error("Error exporting calendar:", error);
    throw error instanceof Error
      ? error
      : new Error("Falha ao exportar o calendário. Por favor, tente novamente.");
  }
}
