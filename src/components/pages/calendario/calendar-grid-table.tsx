import { useMemo } from "react";
import { DAY_NAMES, DAY_NUMBERS, CALENDAR_TIME_SLOTS } from "@/lib/client/calendario/constants";
import { parseHorarioToSlots } from "@/lib/client/calendario/utils";
import type { ClassWithRoom } from "./types";
import { processDaySlots } from "./calendar-utils";
import CalendarCell from "./calendar-cell";

type CalendarGridTableProps = {
  classes: ClassWithRoom[];
  classColors: Map<number, string>;
  isDark: boolean;
  onCellClick?: (
    classes: ClassWithRoom[],
    day: number,
    timeSlotIndex: number,
    anchor?: HTMLElement
  ) => void;
  compact?: boolean;
  stickyTimeColumn?: boolean;
  showFullDay?: boolean;
};

export function CalendarGridTable({
  classes,
  classColors,
  isDark,
  onCellClick,
  compact = false,
  stickyTimeColumn = true,
  showFullDay = false,
}: CalendarGridTableProps) {
  const slots = classes.flatMap(item => parseHorarioToSlots(item.horario));
  const days = [1, ...DAY_NUMBERS].filter(
    day => (day !== 1 && day !== 7) || slots.some(slot => slot.day === day)
  );
  const occupiedSlots = slots.map(slot => slot.timeSlot);
  const visibleTimeSlots =
    showFullDay || slots.length === 0
      ? CALENDAR_TIME_SLOTS
      : CALENDAR_TIME_SLOTS.filter(
          slot =>
            slot.index >= Math.min(...occupiedSlots) && slot.index <= Math.max(...occupiedSlots)
        );
  // Pre-process all days to identify merged slots
  const daySlotData = useMemo(() => {
    const data = new Map<number, ReturnType<typeof processDaySlots>>();
    [1, ...DAY_NUMBERS].forEach(day => {
      data.set(day, processDaySlots(day, classes));
    });
    return data;
  }, [classes]);

  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0";

  const handleCellClick = (
    cellClasses: ClassWithRoom[],
    day: number,
    timeSlotIndex: number,
    anchor: HTMLElement
  ) => {
    if (!onCellClick || cellClasses.length === 0) {
      return;
    }
    onCellClick(cellClasses, day, timeSlotIndex, anchor);
  };

  return (
    <table
      className="w-full table-fixed border-separate border-spacing-0"
      style={{ borderColor }}
      aria-label="Grade semanal de aulas"
    >
      <caption className="sr-only">Dias, horários e salas das turmas selecionadas</caption>
      <thead>
        <tr>
          <th
            className={`sticky top-20 z-20 p-2 text-left text-xs font-semibold w-24 ${
              stickyTimeColumn ? "left-0" : ""
            }`}
            style={{
              backgroundColor: isDark ? "rgba(26, 58, 92, 0.8)" : "#f8fafc",
              color: isDark ? "#C8E6FA" : "#0e3a6c",
            }}
          >
            Horário
          </th>
          {days.map(day => (
            <th
              key={day}
              className="sticky top-20 z-10 p-2 text-center text-xs font-semibold"
              style={{
                backgroundColor: isDark ? "rgba(26, 58, 92, 0.8)" : "#f8fafc",
                color: isDark ? "#C8E6FA" : "#0e3a6c",
              }}
            >
              {DAY_NAMES[day]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {visibleTimeSlots.map(timeSlot => (
          <tr key={timeSlot.index} className={compact ? "h-10" : "h-12"}>
            <td
              className={`p-2 text-xs ${stickyTimeColumn ? "sticky left-0 z-10" : ""}`}
              style={{
                backgroundColor: isDark ? "rgba(26, 58, 92, 0.6)" : "#f8fafc",
                color: isDark ? "#E5F6FF" : "#0e3a6c",
                borderRight: `1px solid ${borderColor}`,
              }}
            >
              {timeSlot.label}
            </td>
            {days.map(day => {
              const dayData = daySlotData.get(day);
              const slotData = dayData?.get(timeSlot.index);

              if (!slotData) {
                return (
                  <CalendarCell
                    key={day}
                    classes={[]}
                    classColors={classColors}
                    isDark={isDark}
                    rowSpan={1}
                    isStartOfMerge
                    onCellClick={
                      onCellClick
                        ? anchor => handleCellClick([], day, timeSlot.index, anchor)
                        : undefined
                    }
                  />
                );
              }

              // Skip rendering if this is part of a merged block but not the start
              if (slotData.rowSpan > 1 && !slotData.isStartOfMerge) {
                return null;
              }

              return (
                <CalendarCell
                  key={day}
                  classes={slotData.classes}
                  classColors={classColors}
                  isDark={isDark}
                  rowSpan={slotData.rowSpan}
                  isStartOfMerge={slotData.isStartOfMerge}
                  onCellClick={
                    onCellClick
                      ? anchor => handleCellClick(slotData.classes, day, timeSlot.index, anchor)
                      : undefined
                  }
                />
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
