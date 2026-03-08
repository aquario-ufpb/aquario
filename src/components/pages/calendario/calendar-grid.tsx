import { useState, useRef } from "react";
import { Calendar, AlertTriangle, Download, CalendarPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CALENDAR_TIME_SLOTS, DAY_NAMES } from "@/lib/client/calendario/constants";
import { exportCalendarAsImage } from "@/lib/client/calendario/export";
import { generateICSFile, downloadICSFile } from "@/lib/client/calendario/ics";
import { generateGoogleCalendarLinks } from "@/lib/client/calendario/google-calendar";
import { trackEvent } from "@/analytics/posthog-client";
import { toast } from "sonner";
import { useSemestres } from "@/lib/client/hooks/use-calendario-academico";
import CalendarLegend from "./calendar-legend";
import ClassDetailsDialog from "./class-details-dialog";
import GoogleCalendarDialog from "./google-calendar-dialog";
import { CalendarGridTable } from "./calendar-grid-table";
import { CalendarMobileView } from "./calendar-mobile-view";
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
  semesterName?: string;
};

export default function CalendarGrid({
  selectedClasses,
  classColors,
  conflicts,
  isDark,
  calendarRef,
  semesterName,
}: CalendarGridProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCellData, setSelectedCellData] = useState<{
    classes: ClassWithRoom[];
    day: string;
    timeSlot: string;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingICS, setIsGeneratingICS] = useState(false);
  const [googleCalendarDialogOpen, setGoogleCalendarDialogOpen] = useState(false);
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<
    ReturnType<typeof generateGoogleCalendarLinks>
  >([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const { data: semestres, isLoading: isLoadingSemestres } = useSemestres();
  const semestre = semesterName ? semestres?.find(s => s.nome === semesterName) : undefined;

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
    trackEvent("calendar_export_image_click");
    setIsExporting(true);
    try {
      await exportCalendarAsImage({
        selectedClasses,
        classColors,
        conflicts,
        isDark,
        filename: "calendario-alocacao.png",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao exportar o calendário");
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddToCalendar = async () => {
    if (selectedClasses.length === 0) {
      toast.error("Nenhuma disciplina selecionada para adicionar ao calendário");
      return;
    }
    if (!semestre) {
      toast.error("Não foi possível obter as datas do semestre atual");
      return;
    }

    trackEvent("calendar_export_calendar_click");
    setIsGeneratingICS(true);
    try {
      const startDate = new Date(semestre.dataInicio);
      const endDate = new Date(semestre.dataFim);
      const blob = await generateICSFile(selectedClasses, startDate, endDate);
      downloadICSFile(blob, "calendario-disciplinas.ics");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao gerar arquivo de calendário");
    } finally {
      setIsGeneratingICS(false);
    }
  };

  const handleOpenGoogleCalendar = () => {
    if (selectedClasses.length === 0) {
      toast.error("Nenhuma disciplina selecionada para adicionar ao calendário");
      return;
    }
    if (!semestre) {
      toast.error("Não foi possível obter as datas do semestre atual");
      return;
    }

    trackEvent("calendar_add_google_calendar_click");
    const startDate = new Date(semestre.dataInicio);
    const endDate = new Date(semestre.dataFim);
    const events = generateGoogleCalendarLinks(selectedClasses, startDate, endDate);
    setGoogleCalendarEvents(events);
    setGoogleCalendarDialogOpen(true);
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
            {/* Mobile view - vertical day-by-day layout */}
            <div className="md:hidden">
              <CalendarMobileView
                classes={selectedClasses}
                classColors={classColors}
                isDark={isDark}
                onCellClick={handleCellClick}
              />
            </div>

            {/* Desktop view - table layout */}
            <div className="hidden md:block overflow-x-auto">
              <CalendarGridTable
                classes={selectedClasses}
                classColors={classColors}
                isDark={isDark}
                onCellClick={handleCellClick}
              />
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
            semesterStartDate={semestre ? new Date(semestre.dataInicio) : undefined}
            semesterEndDate={semestre ? new Date(semestre.dataFim) : undefined}
          />
        )}
      </Card>

      {/* Action buttons below the calendar */}
      <div className="flex justify-center gap-3 mt-4 flex-wrap">
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
          {isExporting ? "Exportando..." : "Exportar Imagem"}
        </Button>
        <Button
          onClick={handleAddToCalendar}
          disabled={
            isGeneratingICS || selectedClasses.length === 0 || isLoadingSemestres || !semestre
          }
          variant="outline"
          size="default"
          className="flex items-center gap-2"
          style={{
            borderColor: isDark ? "rgba(255,255,255,0.2)" : "#e2e8f0",
            color: isDark ? "#C8E6FA" : "#0e3a6c",
          }}
        >
          <CalendarPlus className="w-4 h-4" />
          {isGeneratingICS ? "Gerando..." : "Exportar Calendário (ICS)"}
        </Button>
        <Button
          onClick={handleOpenGoogleCalendar}
          disabled={selectedClasses.length === 0 || isLoadingSemestres || !semestre}
          variant="outline"
          size="default"
          className="flex items-center gap-2"
          style={{
            borderColor: isDark ? "rgba(255,255,255,0.2)" : "#e2e8f0",
            color: isDark ? "#C8E6FA" : "#0e3a6c",
          }}
        >
          <Calendar className="w-4 h-4" />
          Adicionar ao Google Calendar
        </Button>
      </div>

      <GoogleCalendarDialog
        events={googleCalendarEvents}
        isOpen={googleCalendarDialogOpen}
        onClose={() => setGoogleCalendarDialogOpen(false)}
        isDark={isDark}
      />
    </>
  );
}
