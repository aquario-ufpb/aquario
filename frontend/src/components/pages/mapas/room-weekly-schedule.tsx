"use client";

import React, { useMemo, useState } from "react";
import type { ClassWithRoom } from "@/components/pages/calendario/types";
import { CALENDAR_TIME_SLOTS, CLASS_COLORS, DAY_NAMES } from "@/lib/calendario/constants";
import { CalendarGridTable } from "@/components/pages/calendario/calendar-grid-table";
import ClassDetailsDialog from "@/components/pages/calendario/class-details-dialog";

type RoomWeeklyScheduleProps = {
  classes: ClassWithRoom[];
  isDark: boolean;
};

export function RoomWeeklySchedule({ classes, isDark }: RoomWeeklyScheduleProps) {
  const textColor = isDark ? "#E5F6FF" : "#0e3a6c";

  // Generate simple color mapping for these classes
  const classColors = useMemo(() => {
    const colorMap = new Map<number, string>();
    classes.forEach((classItem, index) => {
      colorMap.set(classItem.id, CLASS_COLORS[index % CLASS_COLORS.length]);
    });
    return colorMap;
  }, [classes]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCellData, setSelectedCellData] = useState<{
    classes: ClassWithRoom[];
    day: string;
    timeSlot: string;
  } | null>(null);

  const handleCellClick = (cellClasses: ClassWithRoom[], day: number, timeSlotIndex: number) => {
    if (cellClasses.length === 0) {
      return;
    }

    const dayName = DAY_NAMES[day] || `Dia ${day}`;
    const timeSlot = CALENDAR_TIME_SLOTS[timeSlotIndex - 1];
    const timeSlotLabel = timeSlot ? timeSlot.label : "";

    setSelectedCellData({
      classes: cellClasses,
      day: dayName,
      timeSlot: timeSlotLabel,
    });
    setDialogOpen(true);
  };

  if (classes.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-3">
      <h4 className="text-sm font-semibold" style={{ color: textColor }}>
        Horário nesta sala
      </h4>

      <div className="overflow-x-auto rounded-lg border border-transparent max-w-full">
        <CalendarGridTable
          classes={classes}
          classColors={classColors}
          isDark={isDark}
          compact
          stickyTimeColumn={false}
          onCellClick={handleCellClick}
        />
      </div>

      {selectedCellData && (
        <ClassDetailsDialog
          classes={selectedCellData.classes}
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          isDark={isDark}
          day={selectedCellData.day}
          timeSlot={selectedCellData.timeSlot}
        />
      )}
    </div>
  );
}
