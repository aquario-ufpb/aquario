import { CALENDAR_TIME_SLOTS, DAY_NAMES } from "@/lib/shared/calendario/constants";
import { parseHorarioToSlots } from "@/lib/shared/calendario/utils";
import { PLANNER_CLASS_COLORS } from "@/lib/shared/planner/display";
import { meetingsFor, timeLabel } from "@/lib/shared/planner/solver";
import type { PlannerSolution } from "@/lib/shared/planner/types";

/** Render only the selected schedule, without page controls or academic history. */
export async function downloadScheduleImage(solution: PlannerSolution, semester: string) {
  const parsed = solution.selections.flatMap(item => parseHorarioToSlots(item.offer.schedule));
  const occupied = parsed.map(slot => slot.timeSlot);
  const rows = occupied.length
    ? CALENDAR_TIME_SLOTS.filter(
        slot => slot.index >= Math.min(...occupied) && slot.index <= Math.max(...occupied)
      )
    : [...CALENDAR_TIME_SLOTS];
  const days = [2, 3, 4, 5, 6, 7];
  if (parsed.some(slot => slot.day === 1)) {
    days.unshift(1);
  }
  const width = 1600,
    margin = 48,
    timeWidth = 140,
    rowHeight = 74,
    top = 170;
  const column = (width - margin * 2 - timeWidth) / days.length;
  const legendY = top + rows.length * rowHeight + 40;
  const canvas = document.createElement("canvas");
  canvas.width = width * 2;
  canvas.height =
    (legendY + solution.selections.length * 94 + solution.conditional.length * 42 + 96) * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Seu navegador não conseguiu gerar a imagem.");
  }
  ctx.scale(2, 2);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, canvas.height / 2);
  const text = (
    value: string,
    x: number,
    y: number,
    maxWidth: number,
    size = 18,
    color = "#0f172a",
    bold = false
  ) => {
    ctx.font = `${bold ? "600" : "400"} ${size}px Arial, sans-serif`;
    ctx.fillStyle = color;
    let label = value;
    while (ctx.measureText(label).width > maxWidth && label.length > 1) {
      label = label.slice(0, -1);
    }
    if (label !== value) {
      label = label.slice(0, -1) + "…";
    }
    ctx.fillText(label, x, y);
  };
  text(`Aquário · Minha grade · ${semester}`, margin, 56, width - margin * 2, 32, "#0e3a6c", true);
  text(
    `Planejamento de matrícula · ${solution.selections.length} disciplinas · ${solution.workload}h · horário de Recife`,
    margin,
    90,
    width - margin * 2
  );
  text(
    "Simulação: confirme matrícula, vagas, horários e salas no SIGAA.",
    margin,
    118,
    width - margin * 2,
    16,
    "#475569"
  );
  days.forEach((day, index) =>
    text(
      DAY_NAMES[day],
      margin + timeWidth + index * column + 12,
      top - 18,
      column - 20,
      19,
      "#0e3a6c",
      true
    )
  );
  rows.forEach((row, index) => {
    const y = top + index * rowHeight;
    ctx.fillStyle = index % 2 ? "#f1f5f9" : "#f8fafc";
    ctx.fillRect(margin, y, width - margin * 2, rowHeight);
    text(`${row.period}${row.slot}`, margin + 12, y + 29, timeWidth - 20, 16, "#475569", true);
    text(row.label, margin + 12, y + 53, timeWidth - 20, 14, "#475569");
    ctx.strokeStyle = "#cbd5e1";
    days.forEach((_, columnIndex) =>
      ctx.strokeRect(margin + timeWidth + columnIndex * column, y, column, rowHeight)
    );
  });
  solution.selections.forEach(({ offer }, index) => {
    const color = PLANNER_CLASS_COLORS[index % PLANNER_CLASS_COLORS.length];
    meetingsFor(offer.schedule).forEach(meeting => {
      const dayIndex = days.indexOf(meeting.day + 1);
      const toMinute = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3));
      const first = rows.findIndex(row => toMinute(row.label.split("-")[0]) === meeting.start);
      const last = rows.findIndex(row => toMinute(row.label.split("-")[1]) === meeting.end);
      if (dayIndex < 0 || first < 0 || last < first) {
        return;
      }
      const x = margin + timeWidth + dayIndex * column + 3,
        y = top + first * rowHeight + 3;
      const height = (last - first + 1) * rowHeight - 6;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, column - 6, height);
      text(offer.name, x + 10, y + 24, column - 26, 16, "#ffffff", true);
      text(`${offer.code} · T${offer.section}`, x + 10, y + 46, column - 26, 14, "#ffffff");
      if (height > 80) {
        text(
          `${timeLabel(meeting.start)}–${timeLabel(meeting.end)}`,
          x + 10,
          y + 70,
          column - 26,
          15,
          "#ffffff"
        );
        text(offer.location ?? "Sala a confirmar", x + 10, y + 94, column - 26, 14, "#ffffff");
      }
    });
    const y = legendY + index * 94;
    ctx.fillStyle = color;
    ctx.fillRect(margin, y - 18, 8, 72);
    text(
      `${offer.name} (${offer.code}) · Turma ${offer.section}`,
      margin + 22,
      y,
      width - margin * 2 - 22,
      20,
      "#0f172a",
      true
    );
    text(
      `${offer.teacher || "Docente a confirmar"} · ${offer.location ?? "Sala a confirmar"}`,
      margin + 22,
      y + 28,
      width - margin * 2 - 22,
      17
    );
    text(
      `Horário SIGAA: ${offer.schedule}`,
      margin + 22,
      y + 52,
      width - margin * 2 - 22,
      16,
      "#475569"
    );
  });
  solution.conditional.forEach((reason, index) =>
    text(
      `A conferir: ${reason}`,
      margin,
      legendY + solution.selections.length * 94 + index * 42,
      width - margin * 2,
      17,
      "#92400e"
    )
  );
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      value => (value ? resolve(value) : reject(new Error("Não foi possível gerar o PNG."))),
      "image/png"
    )
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `grade-${semester}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
