"use client";

import { useMemo } from "react";
import { DAYS, DAY_NUMBERS, CALENDAR_TIME_SLOTS } from "@/lib/client/calendario/constants";
import type { ClassWithRoom } from "./types";
import { processDaySlots, type MergedSlot } from "./calendar-utils";
import { AlertTriangle } from "lucide-react";

type CalendarMobileViewProps = {
  classes: ClassWithRoom[];
  classColors: Map<number, string>;
  isDark: boolean;
  onCellClick?: (classes: ClassWithRoom[], day: number, timeSlotIndex: number) => void;
};

// Helper functions
function calculateTimeRangeLabel(
  timeSlot: (typeof CALENDAR_TIME_SLOTS)[number],
  slotData: MergedSlot | undefined
): string {
  if (!slotData || slotData.rowSpan <= 1) {
    return timeSlot.label;
  }

  const endSlotIndex = timeSlot.index + slotData.rowSpan - 1;
  const endSlot = CALENDAR_TIME_SLOTS.find(s => s.index === endSlotIndex);

  if (!endSlot) {
    return timeSlot.label;
  }

  // Extract end time from end slot label (e.g., "09:00-10:00" -> "10:00")
  const endTime = endSlot.label.split("-")[1]?.trim();
  // Extract start time from start slot label (e.g., "08:00-09:00" -> "08:00")
  const startTime = timeSlot.label.split("-")[0]?.trim();

  if (startTime && endTime) {
    return `${startTime}-${endTime}`;
  }

  return timeSlot.label;
}

function hasClassesForDay(dayData: Map<number, MergedSlot> | undefined): boolean {
  if (!dayData) {
    return false;
  }

  return CALENDAR_TIME_SLOTS.some(slot => {
    const slotData = dayData.get(slot.index);
    return slotData && slotData.classes.length > 0;
  });
}

function shouldSkipSlot(slotData: MergedSlot | undefined, cellClasses: ClassWithRoom[]): boolean {
  // Skip if this is part of a merged block but not the start
  if (slotData && slotData.rowSpan > 1 && !slotData.isStartOfMerge) {
    return true;
  }

  // Skip empty time slots
  if (cellClasses.length === 0) {
    return true;
  }

  return false;
}

// Sub-components
type DayHeaderProps = {
  dayName: string;
  borderColor: string;
  textColor: string;
  headerBg: string;
};

function DayHeader({ dayName, borderColor, textColor, headerBg }: DayHeaderProps) {
  return (
    <div
      className="p-3 font-semibold text-sm border-b"
      style={{
        backgroundColor: headerBg,
        color: textColor,
        borderColor,
      }}
    >
      {dayName}
    </div>
  );
}

type TimeSlotLabelProps = {
  label: string;
  isDark: boolean;
};

function TimeSlotLabel({ label, isDark }: TimeSlotLabelProps) {
  return (
    <div
      className="text-xs font-medium flex-shrink-0"
      style={{
        color: isDark ? "#C8E6FA" : "#0e3a6c",
        width: "50px",
      }}
    >
      {label}
    </div>
  );
}

type ClassItemProps = {
  classItem: ClassWithRoom;
  classColor: string;
  hasConflict: boolean;
  showConflictBadge: boolean;
  onClick: (e: React.MouseEvent) => void;
};

function ClassItem({
  classItem,
  classColor,
  hasConflict,
  showConflictBadge,
  onClick,
}: ClassItemProps) {
  return (
    <div
      className={`p-2 rounded text-xs w-full ${hasConflict ? "ring-1 ring-red-400/50" : ""}`}
      style={{
        backgroundColor: classColor,
        color: "#fff",
      }}
      title={`${classItem.nome.trim()} - ${classItem.codigo} - ${classItem.room.bloco} ${classItem.room.nome}${hasConflict ? " (Conflito de horário)" : ""}`}
      onClick={onClick}
    >
      {showConflictBadge && (
        <div className="flex items-center gap-1 mb-1">
          <AlertTriangle className="w-3 h-3" style={{ color: "#fff" }} />
          <span className="text-xs font-semibold">Conflito</span>
        </div>
      )}
      <p className="font-semibold break-words">{classItem.nome.trim()}</p>
      <p className="text-xs opacity-90 break-words">
        {classItem.room.bloco} {classItem.room.nome}
      </p>
    </div>
  );
}

type TimeSlotRowProps = {
  timeSlot: (typeof CALENDAR_TIME_SLOTS)[number];
  slotData: MergedSlot | undefined;
  cellClasses: ClassWithRoom[];
  day: number;
  isDark: boolean;
  classColors: Map<number, string>;
  onCellClick?: (classes: ClassWithRoom[], day: number, timeSlotIndex: number) => void;
};

function TimeSlotRow({
  timeSlot,
  slotData,
  cellClasses,
  day,
  isDark,
  classColors,
  onCellClick,
}: TimeSlotRowProps) {
  const hasConflict = cellClasses.length > 1;
  const timeRangeLabel = calculateTimeRangeLabel(timeSlot, slotData);

  const handleClick = () => {
    if (onCellClick && cellClasses.length > 0) {
      onCellClick(cellClasses, day, timeSlot.index);
    }
  };

  const handleClassClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCellClick) {
      onCellClick(cellClasses, day, timeSlot.index);
    }
  };

  return (
    <div
      className={`p-2 sm:p-3 ${cellClasses.length > 0 && onCellClick ? "cursor-pointer hover:opacity-80" : ""}`}
      onClick={cellClasses.length > 0 ? handleClick : undefined}
      style={{
        backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#fff",
      }}
    >
      <div className="flex items-start gap-2 sm:gap-3 w-full">
        <TimeSlotLabel label={timeRangeLabel} isDark={isDark} />

        <div className="flex-1 min-w-0 space-y-2">
          {cellClasses.map((classItem, classIndex) => (
            <ClassItem
              key={classItem.id}
              classItem={classItem}
              classColor={classColors.get(classItem.id) || "#3b82f6"}
              hasConflict={hasConflict}
              showConflictBadge={hasConflict && classIndex === 0}
              onClick={handleClassClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

type DayContentProps = {
  hasClasses: boolean;
  dayData: Map<number, MergedSlot> | undefined;
  day: number;
  borderColor: string;
  isDark: boolean;
  classColors: Map<number, string>;
  onCellClick?: (classes: ClassWithRoom[], day: number, timeSlotIndex: number) => void;
};

function DayContent({
  hasClasses,
  dayData,
  day,
  borderColor,
  isDark,
  classColors,
  onCellClick,
}: DayContentProps) {
  if (!hasClasses) {
    return (
      <div className="p-3">
        <span className="text-xs opacity-50" style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}>
          Sem aulas
        </span>
      </div>
    );
  }

  return (
    <div className="divide-y" style={{ borderColor }}>
      {CALENDAR_TIME_SLOTS.map((timeSlot, slotIndex) => {
        const slotData = dayData?.get(timeSlot.index);
        const cellClasses = slotData?.classes || [];

        if (shouldSkipSlot(slotData, cellClasses)) {
          return null;
        }

        return (
          <TimeSlotRow
            key={slotIndex}
            timeSlot={timeSlot}
            slotData={slotData}
            cellClasses={cellClasses}
            day={day}
            isDark={isDark}
            classColors={classColors}
            onCellClick={onCellClick}
          />
        );
      })}
    </div>
  );
}

type DayCardProps = {
  day: number;
  dayIndex: number;
  dayData: Map<number, MergedSlot> | undefined;
  borderColor: string;
  textColor: string;
  headerBg: string;
  isDark: boolean;
  classColors: Map<number, string>;
  onCellClick?: (classes: ClassWithRoom[], day: number, timeSlotIndex: number) => void;
};

function DayCard({
  day,
  dayIndex,
  dayData,
  borderColor,
  textColor,
  headerBg,
  isDark,
  classColors,
  onCellClick,
}: DayCardProps) {
  const dayName = DAYS[dayIndex];
  const hasClasses = hasClassesForDay(dayData);

  return (
    <div
      className="rounded-lg border w-full overflow-hidden"
      style={{
        borderColor,
        backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#fff",
      }}
    >
      <DayHeader
        dayName={dayName}
        borderColor={borderColor}
        textColor={textColor}
        headerBg={headerBg}
      />
      <DayContent
        hasClasses={hasClasses}
        dayData={dayData}
        day={day}
        borderColor={borderColor}
        isDark={isDark}
        classColors={classColors}
        onCellClick={onCellClick}
      />
    </div>
  );
}

// Main component
export function CalendarMobileView({
  classes,
  classColors,
  isDark,
  onCellClick,
}: CalendarMobileViewProps) {
  // Pre-process all days to identify merged slots
  const daySlotData = useMemo(() => {
    const data = new Map<number, ReturnType<typeof processDaySlots>>();
    DAY_NUMBERS.forEach(day => {
      data.set(day, processDaySlots(day, classes));
    });
    return data;
  }, [classes]);

  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0";
  const textColor = isDark ? "#E5F6FF" : "#0e3a6c";
  const headerBg = isDark ? "rgba(26, 58, 92, 0.8)" : "#f8fafc";

  return (
    <div className="space-y-4 w-full">
      {DAY_NUMBERS.map((day, dayIndex) => {
        const dayData = daySlotData.get(day);

        return (
          <DayCard
            key={day}
            day={day}
            dayIndex={dayIndex}
            dayData={dayData}
            borderColor={borderColor}
            textColor={textColor}
            headerBg={headerBg}
            isDark={isDark}
            classColors={classColors}
            onCellClick={onCellClick}
          />
        );
      })}
    </div>
  );
}
