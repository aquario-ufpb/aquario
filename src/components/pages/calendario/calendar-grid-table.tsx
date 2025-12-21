import { useMemo } from "react";
import { DAYS, DAY_NUMBERS, CALENDAR_TIME_SLOTS } from "@/lib/calendario/constants";
import type { ClassWithRoom } from "./types";
import { processDaySlots } from "./calendar-utils";
import CalendarCell from "./calendar-cell";

type CalendarGridTableProps = {
  classes: ClassWithRoom[];
  classColors: Map<number, string>;
  isDark: boolean;
  onCellClick?: (classes: ClassWithRoom[], day: number, timeSlotIndex: number) => void;
  compact?: boolean;
  stickyTimeColumn?: boolean;
};

export function CalendarGridTable({
  classes,
  classColors,
  isDark,
  onCellClick,
  compact = false,
  stickyTimeColumn = true,
}: CalendarGridTableProps) {
  // Pre-process all days to identify merged slots
  const daySlotData = useMemo(() => {
    const data = new Map<number, ReturnType<typeof processDaySlots>>();
    DAY_NUMBERS.forEach(day => {
      data.set(day, processDaySlots(day, classes));
    });
    return data;
  }, [classes]);

  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0";

  const handleCellClick = (cellClasses: ClassWithRoom[], day: number, timeSlotIndex: number) => {
    if (!onCellClick || cellClasses.length === 0) {
      return;
    }
    onCellClick(cellClasses, day, timeSlotIndex);
  };

  return (
    <table className="w-full border-collapse" style={{ borderColor }}>
      <thead>
        <tr>
          <th
            className={`p-2 text-left text-xs font-semibold ${
              stickyTimeColumn ? "sticky left-0 z-10" : ""
            }`}
            style={{
              backgroundColor: isDark ? "rgba(26, 58, 92, 0.8)" : "#f8fafc",
              color: isDark ? "#C8E6FA" : "#0e3a6c",
              minWidth: compact ? "80px" : "120px",
            }}
          >
            Horário
          </th>
          {DAYS.map(day => (
            <th
              key={day}
              className="p-2 text-center text-xs font-semibold"
              style={{
                backgroundColor: isDark ? "rgba(26, 58, 92, 0.8)" : "#f8fafc",
                color: isDark ? "#C8E6FA" : "#0e3a6c",
                minWidth: compact ? "90px" : "150px",
              }}
            >
              {day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {CALENDAR_TIME_SLOTS.map((timeSlot, slotIndex) => (
          <tr key={slotIndex}>
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
            {DAY_NUMBERS.map(day => {
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
                      onCellClick ? () => handleCellClick([], day, timeSlot.index) : undefined
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
                      ? () => handleCellClick(slotData.classes, day, timeSlot.index)
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
