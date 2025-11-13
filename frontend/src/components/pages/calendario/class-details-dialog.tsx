import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, BookOpen, AlertTriangle } from "lucide-react";
import { formatHorario } from "@/lib/calendario/utils";
import type { ClassWithRoom } from "./types";

type ClassDetailsDialogProps = {
  classes: ClassWithRoom[];
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  day: string;
  timeSlot: string;
};

export default function ClassDetailsDialog({
  classes,
  isOpen,
  onClose,
  isDark,
  day,
  timeSlot,
}: ClassDetailsDialogProps) {
  const hasConflict = classes.length > 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`max-w-2xl max-h-[90vh] overflow-y-auto ${
          isDark ? "bg-gray-900 border-white/20" : "bg-white border-gray-200"
        }`}
      >
        <DialogHeader>
          <DialogTitle
            className="flex items-center gap-2"
            style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
          >
            <BookOpen className="w-5 h-5" />
            Detalhes da Disciplina{classes.length > 1 ? "s" : ""}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm pt-2">
            <span style={{ color: isDark ? "#E5F6FF/80" : "#0e3a6c/80" }}>
              {day} - {timeSlot}
            </span>
            {hasConflict && (
              <Badge className={isDark ? "bg-red-500/20 text-red-300" : "bg-red-100 text-red-800"}>
                <AlertTriangle className="w-3 h-3 mr-1" />
                Conflito
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {classes.map(classItem => (
            <div
              key={classItem.id}
              className={`p-4 rounded-lg border ${
                isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
              }`}
            >
              <h3
                className="text-lg font-semibold mb-3"
                style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
              >
                {classItem.nome.trim()}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <BookOpen
                      className="w-4 h-4 mt-1 flex-shrink-0"
                      style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }}
                    />
                    <div>
                      <p
                        className="text-xs mb-1"
                        style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}
                      >
                        Código
                      </p>
                      <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>{classItem.codigo}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <BookOpen
                      className="w-4 h-4 mt-1 flex-shrink-0"
                      style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }}
                    />
                    <div>
                      <p
                        className="text-xs mb-1"
                        style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}
                      >
                        Turma
                      </p>
                      <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>{classItem.turma}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock
                      className="w-4 h-4 mt-1 flex-shrink-0"
                      style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }}
                    />
                    <div>
                      <p
                        className="text-xs mb-1"
                        style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}
                      >
                        Horário
                      </p>
                      <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>
                        {formatHorario(classItem.horario)}
                      </p>
                      <p
                        className="text-xs mt-1"
                        style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}
                      >
                        ({classItem.horario})
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin
                      className="w-4 h-4 mt-1 flex-shrink-0"
                      style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }}
                    />
                    <div>
                      <p
                        className="text-xs mb-1"
                        style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}
                      >
                        Localização
                      </p>
                      <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>
                        {classItem.room.bloco} - {classItem.room.nome}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Users
                      className="w-4 h-4 mt-1 flex-shrink-0"
                      style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }}
                    />
                    <div>
                      <p
                        className="text-xs mb-1"
                        style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}
                      >
                        Alunos
                      </p>
                      <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>
                        {classItem.alunos} alunos
                      </p>
                    </div>
                  </div>

                  {classItem.docente && (
                    <div className="flex items-start gap-2">
                      <BookOpen
                        className="w-4 h-4 mt-1 flex-shrink-0"
                        style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }}
                      />
                      <div>
                        <p
                          className="text-xs mb-1"
                          style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}
                        >
                          Docente
                        </p>
                        <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>
                          {classItem.docente.trim()}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <BookOpen
                      className="w-4 h-4 mt-1 flex-shrink-0"
                      style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }}
                    />
                    <div>
                      <p
                        className="text-xs mb-1"
                        style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}
                      >
                        Departamento
                      </p>
                      <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>
                        {classItem.departamento}
                      </p>
                    </div>
                  </div>

                  {classItem.pcd === 1 && (
                    <div>
                      <Badge
                        className={
                          isDark
                            ? "bg-purple-500/20 text-purple-300"
                            : "bg-purple-100 text-purple-800"
                        }
                      >
                        Acessível para PCD
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
