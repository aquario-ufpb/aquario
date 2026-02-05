import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, Copy, Check } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import type { GoogleCalendarEvent } from "@/lib/client/calendario/google-calendar";

type GoogleCalendarDialogProps = {
  events: GoogleCalendarEvent[];
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
};

export default function GoogleCalendarDialog({
  events,
  isOpen,
  onClose,
  isDark,
}: GoogleCalendarDialogProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopyLink = useCallback(async (url: string, index: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);

      // Clear previous timeout if exists
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setCopiedIndex(null);
        timeoutRef.current = null;
      }, 2000);
    } catch {
      // Clipboard API not available or permission denied - silent fail
    }
  }, []);

  const handleOpenLink = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`max-w-3xl max-h-[90vh] overflow-y-auto ${
          isDark ? "bg-gray-900 border-white/20" : "bg-white border-gray-200"
        }`}
      >
        <DialogHeader>
          <DialogTitle
            className="flex items-center gap-2"
            style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
          >
            <Calendar className="w-5 h-5" />
            Adicionar ao Google Calendar
          </DialogTitle>
          <p className="text-sm pt-2" style={{ color: isDark ? "#E5F6FF/80" : "#0e3a6c/80" }}>
            Clique em cada link para adicionar o evento ao seu Google Calendar. Cada evento será
            adicionado individualmente com recorrência semanal configurada automaticamente.
          </p>
          <div
            className="text-xs mt-2 p-2 rounded md:hidden"
            style={{
              backgroundColor: isDark ? "rgba(251, 191, 36, 0.1)" : "rgba(251, 191, 36, 0.1)",
              color: isDark ? "#fbbf24" : "#92400e",
              border: `1px solid ${isDark ? "rgba(251, 191, 36, 0.3)" : "rgba(251, 191, 36, 0.3)"}`,
            }}
          >
            <strong>Nota:</strong> Em dispositivos móveis, a recorrência pode não ser aplicada
            automaticamente. Se isso acontecer, após adicionar o evento, edite-o e configure a
            recorrência manualmente como &quot;Semanal&quot; nos dias indicados.
          </div>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {events.map(event => (
            <div
              key={event.classItem.id}
              className={`p-4 rounded-lg border ${
                isDark ? "bg-slate-800/50 border-white/10" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <h3
                    className="text-base font-semibold mb-2 break-words"
                    style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
                  >
                    {event.title}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p style={{ color: isDark ? "#E5F6FF/80" : "#0e3a6c/80" }}>
                      <strong>Horário:</strong> {event.timeRange}
                    </p>
                    <p style={{ color: isDark ? "#E5F6FF/80" : "#0e3a6c/80" }}>
                      <strong>Local:</strong> {event.location}
                    </p>
                    <p style={{ color: isDark ? "#E5F6FF/80" : "#0e3a6c/80" }}>
                      <strong>Código:</strong> {event.classItem.codigo} - Turma:{" "}
                      {event.classItem.turma}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                  <Button
                    onClick={() => handleCopyLink(event.url, events.indexOf(event))}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 flex-1 sm:flex-initial"
                    style={{
                      borderColor: isDark ? "rgba(255,255,255,0.2)" : "#e2e8f0",
                      color: isDark ? "#C8E6FA" : "#0e3a6c",
                    }}
                  >
                    {copiedIndex === events.indexOf(event) ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copiar
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleOpenLink(event.url)}
                    size="sm"
                    className="flex items-center gap-1 flex-1 sm:flex-initial"
                    style={{
                      backgroundColor: isDark ? "#1a3a5c" : "#0e3a6c",
                      color: isDark ? "#C8E6FA" : "#fff",
                    }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Abrir
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div
            className="text-center py-8 text-sm"
            style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}
          >
            Nenhum evento para adicionar.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
