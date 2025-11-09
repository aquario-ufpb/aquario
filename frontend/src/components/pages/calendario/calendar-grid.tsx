import { useMemo, useState, useRef } from "react";
import { Calendar, AlertTriangle, Download, CalendarPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DAYS, DAY_NUMBERS, CALENDAR_TIME_SLOTS, DAY_NAMES } from "@/lib/calendario/constants";
import { exportCalendarAsImage } from "@/lib/calendario/export";
import { generateICSFile, downloadICSFile } from "@/lib/calendario/ics";
import CalendarLegend from "./calendar-legend";
import CalendarCell from "./calendar-cell";
import ClassDetailsDialog from "./class-details-dialog";
import { processDaySlots } from "./calendar-utils";
import type { ClassWithRoom } from "./types";

type CalendarGridProps = {
  selectedClasses: ClassWithRoom[];
  classColors: Map<number, string>;
  conflicts: Array<{
    day: number;
    timeSlot: number;
    classes: ClassWithRoom[];
  }>;
  isDark: boolean;
  calendarRef: React.RefObject<HTMLDivElement>;
};

export default function CalendarGrid({
  selectedClasses,
  classColors,
  conflicts,
  isDark,
  calendarRef,
}: CalendarGridProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCellData, setSelectedCellData] = useState<{
    classes: ClassWithRoom[];
    day: string;
    timeSlot: string;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingICS, setIsGeneratingICS] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Pre-process all days to identify merged slots
  const daySlotData = useMemo(() => {
    const data = new Map<number, ReturnType<typeof processDaySlots>>();
    DAY_NUMBERS.forEach(day => {
      data.set(day, processDaySlots(day, selectedClasses));
    });
    return data;
  }, [selectedClasses]);

  const handleCellClick = (classes: ClassWithRoom[], day: number, timeSlotIndex: number) => {
    if (classes.length === 0) {
      return;
    }

    const dayName = DAY_NAMES[day] || `Dia ${day}`;
    const timeSlot = CALENDAR_TIME_SLOTS[timeSlotIndex - 1];
    const timeSlotLabel = timeSlot ? timeSlot.label : "";

    setSelectedCellData({
      classes,
      day: dayName,
      timeSlot: timeSlotLabel,
    });
    setDialogOpen(true);
  };

  const handleExport = async () => {
    if (!contentRef.current) {
      return;
    }

    setIsExporting(true);
    try {
      // Use the contentRef which points directly to the CardContent
      const bgColor = isDark ? "#0f2338" : "#ffffff";
      await exportCalendarAsImage(contentRef.current, "calendario-alocacao.png", bgColor);
    } catch (error) {
      console.error("Error exporting calendar:", error);
      alert(error instanceof Error ? error.message : "Erro ao exportar o calendário");
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddToCalendar = async () => {
    if (selectedClasses.length === 0) {
      alert("Nenhuma disciplina selecionada para adicionar ao calendário");
      return;
    }

    setIsGeneratingICS(true);
    try {
      const blob = await generateICSFile(selectedClasses);
      downloadICSFile(blob, "calendario-disciplinas.ics");
    } catch (error) {
      console.error("Error generating ICS file:", error);
      alert(error instanceof Error ? error.message : "Erro ao gerar arquivo de calendário");
    } finally {
      setIsGeneratingICS(false);
    }
  };

  return (
    <>
      <Card
        ref={calendarRef}
        className={`mb-8 ${isDark ? "bg-white/5 border-white/20" : "bg-white border-slate-200"}`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle
              className="flex items-center gap-2"
              style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
            >
              <Calendar className="w-5 h-5" />
              Calendário Visual
            </CardTitle>
            {conflicts.length > 0 && (
              <div
                className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: isDark ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.1)",
                  color: isDark ? "#fca5a5" : "#dc2626",
                }}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>
                  {conflicts.length} conflito{conflicts.length !== 1 ? "s" : ""} de horário
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div ref={contentRef} className="w-full" data-export-target>
            <div className="overflow-x-auto">
              <table
                className="w-full border-collapse"
                style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0" }}
              >
                <thead>
                  <tr>
                    <th
                      className="p-2 text-left text-xs font-semibold sticky left-0 z-10"
                      style={{
                        backgroundColor: isDark ? "rgba(26, 58, 92, 0.8)" : "#f8fafc",
                        color: isDark ? "#C8E6FA" : "#0e3a6c",
                        minWidth: "120px",
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
                          minWidth: "150px",
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
                        className="p-2 text-xs sticky left-0 z-10"
                        style={{
                          backgroundColor: isDark ? "rgba(26, 58, 92, 0.6)" : "#f8fafc",
                          color: isDark ? "#E5F6FF" : "#0e3a6c",
                          borderRight: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
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
                              isStartOfMerge={true}
                              onCellClick={() => handleCellClick([], day, timeSlot.index)}
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
                            onCellClick={() =>
                              handleCellClick(slotData.classes, day, timeSlot.index)
                            }
                          />
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <CalendarLegend
              selectedClasses={selectedClasses}
              classColors={classColors}
              isDark={isDark}
            />
          </div>
        </CardContent>

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
      </Card>

      {/* Action buttons below the calendar */}
      <div className="flex justify-center gap-3 mt-4">
        <Button
          onClick={handleExport}
          disabled={isExporting}
          variant="outline"
          size="default"
          className="flex items-center gap-2"
          style={{
            borderColor: isDark ? "rgba(255,255,255,0.2)" : "#e2e8f0",
            color: isDark ? "#C8E6FA" : "#0e3a6c",
          }}
        >
          <Download className="w-4 h-4" />
          {isExporting ? "Exportando..." : "Exportar Calendário"}
        </Button>
        <Button
          onClick={handleAddToCalendar}
          disabled={isGeneratingICS || selectedClasses.length === 0}
          variant="outline"
          size="default"
          className="flex items-center gap-2"
          style={{
            borderColor: isDark ? "rgba(255,255,255,0.2)" : "#e2e8f0",
            color: isDark ? "#C8E6FA" : "#0e3a6c",
          }}
        >
          <CalendarPlus className="w-4 h-4" />
          {isGeneratingICS ? "Gerando..." : "Adicionar ao Calendário"}
        </Button>
      </div>
    </>
  );
}
