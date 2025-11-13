import { DAYS, DAY_NUMBERS, CALENDAR_TIME_SLOTS } from "./constants";
import { processDaySlots } from "@/components/pages/calendario/calendar-utils";
import type { ClassWithRoom } from "@/components/pages/calendario/types";

type ExportCalendarOptions = {
  selectedClasses: ClassWithRoom[];
  classColors: Map<number, string>;
  conflicts: Array<{
    day: number;
    timeSlot: number;
    classes: ClassWithRoom[];
  }>;
  isDark: boolean;
  filename?: string;
};

/**
 * Exports a calendar as a PNG image using Canvas API
 * This approach is more reliable on mobile devices than DOM rendering
 * @param options - Export options including classes, colors, and theme
 * @returns Promise that resolves when the export is complete
 */
export function exportCalendarAsImage({
  selectedClasses,
  classColors,
  conflicts: _conflicts,
  isDark,
  filename = "calendario-alocacao.png",
}: ExportCalendarOptions): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      // Canvas configuration
      const padding = 40;
      const headerHeight = 50;
      const rowHeight = 60;
      const timeColumnWidth = 120;
      const dayColumnWidth = 150;
      const legendSpacing = 20;
      const legendItemHeight = 30;
      const legendRows = Math.ceil(selectedClasses.length / 3); // 3 items per row
      const legendHeight = legendRows > 0 ? 60 + legendRows * legendItemHeight : 0;

      const backgroundColor = isDark ? "#0f2338" : "#ffffff";
      const textColor = isDark ? "#C8E6FA" : "#0e3a6c";
      const borderColor = isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0";
      const headerBgColor = isDark ? "rgba(26, 58, 92, 0.8)" : "#f8fafc";
      const cellBgColor = isDark ? "rgba(255,255,255,0.02)" : "#fff";
      const conflictBorderColor = isDark ? "rgba(239, 68, 68, 0.5)" : "rgba(239, 68, 68, 0.3)";

      // Calculate canvas dimensions
      const tableWidth = timeColumnWidth + DAYS.length * dayColumnWidth;
      const tableHeight = headerHeight + CALENDAR_TIME_SLOTS.length * rowHeight;
      const canvasWidth = tableWidth + padding * 2;
      const canvasHeight = tableHeight + legendHeight + padding * 2 + legendSpacing;

      // Create canvas
      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Não foi possível criar o contexto do canvas");
      }

      // Set up font
      ctx.font = "12px system-ui, -apple-system, sans-serif";
      ctx.textBaseline = "top";

      // Fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Process day slots
      const daySlotData = new Map<number, ReturnType<typeof processDaySlots>>();
      DAY_NUMBERS.forEach(day => {
        daySlotData.set(day, processDaySlots(day, selectedClasses));
      });

      // Draw table background
      const tableX = padding;
      const tableY = padding;

      // Draw header
      ctx.fillStyle = headerBgColor;
      ctx.fillRect(tableX, tableY, tableWidth, headerHeight);

      // Draw header border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(tableX, tableY, tableWidth, headerHeight);

      // Draw header text
      ctx.fillStyle = textColor;
      ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("Horário", tableX + 10, tableY + 18);

      ctx.textAlign = "center";
      DAYS.forEach((day, dayIndex) => {
        const x = tableX + timeColumnWidth + dayIndex * dayColumnWidth + dayColumnWidth / 2;
        ctx.fillText(day, x, tableY + 18);
      });

      // Draw table rows
      ctx.font = "12px system-ui, -apple-system, sans-serif";
      CALENDAR_TIME_SLOTS.forEach((timeSlot, slotIndex) => {
        const rowY = tableY + headerHeight + slotIndex * rowHeight;

        // Draw row background
        ctx.fillStyle = cellBgColor;
        ctx.fillRect(tableX, rowY, tableWidth, rowHeight);

        // Draw time slot label
        ctx.fillStyle = headerBgColor;
        ctx.fillRect(tableX, rowY, timeColumnWidth, rowHeight);
        ctx.fillStyle = textColor;
        ctx.textAlign = "left";
        ctx.fillText(timeSlot.label, tableX + 10, rowY + 20);

        // Draw day cells
        DAY_NUMBERS.forEach((day, dayIndex) => {
          const cellX = tableX + timeColumnWidth + dayIndex * dayColumnWidth;
          const dayData = daySlotData.get(day);
          const slotData = dayData?.get(timeSlot.index);

          // Skip if this is part of a merged block but not the start
          if (slotData && slotData.rowSpan > 1 && !slotData.isStartOfMerge) {
            return;
          }

          const classes = slotData?.classes || [];
          const rowSpan = slotData?.rowSpan || 1;
          const cellHeight = rowSpan * rowHeight;
          const hasConflict = classes.length > 1;

          // Draw cell border
          ctx.strokeStyle = hasConflict ? conflictBorderColor : borderColor;
          ctx.lineWidth = hasConflict ? 2 : 1;
          ctx.strokeRect(cellX, rowY, dayColumnWidth, cellHeight);

          // Draw conflict indicator
          if (hasConflict) {
            ctx.fillStyle = isDark ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)";
            ctx.fillRect(cellX + dayColumnWidth - 20, rowY, 20, 20);
          }

          // Draw class blocks
          if (classes.length > 0) {
            const blockPadding = 4;
            const blockSpacing = 2;
            const availableHeight = cellHeight - blockPadding * 2;
            const blockHeight = Math.min(
              (availableHeight - (classes.length - 1) * blockSpacing) / classes.length,
              50
            );

            classes.forEach((classItem, classIndex) => {
              const blockY = rowY + blockPadding + classIndex * (blockHeight + blockSpacing);
              const classColor = classColors.get(classItem.id) || "#3b82f6";

              // Draw class block background
              ctx.fillStyle = classColor;
              ctx.fillRect(
                cellX + blockPadding,
                blockY,
                dayColumnWidth - blockPadding * 2,
                blockHeight
              );

              // Draw class block border if conflict
              if (hasConflict) {
                ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
                ctx.lineWidth = 1;
                ctx.strokeRect(
                  cellX + blockPadding,
                  blockY,
                  dayColumnWidth - blockPadding * 2,
                  blockHeight
                );
              }

              // Draw class text
              ctx.fillStyle = "#ffffff";
              ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
              ctx.textAlign = "left";
              const className = classItem.nome.trim();
              const roomText = `${classItem.room.bloco} ${classItem.room.nome}`;

              // Truncate text if too long
              const maxWidth = dayColumnWidth - blockPadding * 2 - 8;
              let displayName = className;
              if (ctx.measureText(displayName).width > maxWidth) {
                while (
                  ctx.measureText(displayName + "...").width > maxWidth &&
                  displayName.length > 0
                ) {
                  displayName = displayName.slice(0, -1);
                }
                displayName += "...";
              }

              ctx.fillText(displayName, cellX + blockPadding + 4, blockY + 4);

              ctx.font = "9px system-ui, -apple-system, sans-serif";
              let displayRoom = roomText;
              if (ctx.measureText(displayRoom).width > maxWidth) {
                while (
                  ctx.measureText(displayRoom + "...").width > maxWidth &&
                  displayRoom.length > 0
                ) {
                  displayRoom = displayRoom.slice(0, -1);
                }
                displayRoom += "...";
              }
              ctx.fillText(displayRoom, cellX + blockPadding + 4, blockY + 18);
            });
          }
        });
      });

      // Draw outer table border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(tableX, tableY, tableWidth, tableHeight);

      // Draw legend
      if (selectedClasses.length > 0) {
        const legendY = tableY + tableHeight + legendSpacing;
        const legendX = tableX;

        // Draw legend border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(legendX, legendY);
        ctx.lineTo(legendX + tableWidth, legendY);
        ctx.stroke();

        // Draw legend title
        ctx.fillStyle = textColor;
        ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("Legenda:", legendX, legendY + 10);

        // Draw legend items
        ctx.font = "11px system-ui, -apple-system, sans-serif";
        selectedClasses.forEach((classItem, index) => {
          const itemsPerRow = 3;
          const row = Math.floor(index / itemsPerRow);
          const col = index % itemsPerRow;
          const itemX = legendX + col * (tableWidth / itemsPerRow);
          const itemY = legendY + 30 + row * legendItemHeight;

          const classColor = classColors.get(classItem.id) || "#3b82f6";

          // Draw color box
          ctx.fillStyle = classColor;
          ctx.fillRect(itemX, itemY + 2, 16, 16);

          // Draw class text
          ctx.fillStyle = textColor;
          ctx.textAlign = "left";
          const legendText = `${classItem.codigo} - ${classItem.nome.trim()}`;
          const maxLegendWidth = tableWidth / itemsPerRow - 24;
          let displayLegend = legendText;
          if (ctx.measureText(displayLegend).width > maxLegendWidth) {
            while (
              ctx.measureText(displayLegend + "...").width > maxLegendWidth &&
              displayLegend.length > 0
            ) {
              displayLegend = displayLegend.slice(0, -1);
            }
            displayLegend += "...";
          }
          ctx.fillText(displayLegend, itemX + 20, itemY + 4);
        });
      }

      // Convert canvas to blob and download
      canvas.toBlob(
        blob => {
          if (!blob) {
            reject(new Error("Falha ao gerar a imagem"));
            return;
          }

          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();

          // Clean up
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            resolve();
          }, 200);
        },
        "image/png",
        1.0
      );
    } catch (error) {
      console.error("Error exporting calendar:", error);
      reject(
        error instanceof Error
          ? error
          : new Error("Falha ao exportar o calendário. Por favor, tente novamente.")
      );
    }
  });
}
