"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Info, Ruler } from "lucide-react";
import type { Room } from "@/lib/mapas/types";

type RoomDetailsDialogProps = {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDark: boolean;
};

export default function RoomDetailsDialog({
  room,
  open,
  onOpenChange,
  isDark,
}: RoomDetailsDialogProps) {
  if (!room) {
    return null;
  }

  const { name, metadata } = room;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <MapPin className="w-5 h-5" />
            {name}
          </DialogTitle>
          {metadata?.number && (
            <DialogDescription style={{ color: isDark ? "#E5F6FF/80" : "#0e3a6c/80" }}>
              Número: {metadata.number}
            </DialogDescription>
          )}
        </DialogHeader>

        <div
          className={`p-4 rounded-lg border mt-4 ${
            isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
          }`}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}
          >
            Informações da Sala
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {metadata?.type && (
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
                      Tipo
                    </p>
                    <Badge
                      variant="outline"
                      className={
                        isDark
                          ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                          : "bg-blue-100 text-blue-800 border-blue-200"
                      }
                    >
                      {metadata.type}
                    </Badge>
                  </div>
                </div>
              )}

              {metadata?.capacity && (
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
                      Capacidade
                    </p>
                    <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>
                      {metadata.capacity} pessoas
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <Ruler
                  className="w-4 h-4 mt-1 flex-shrink-0"
                  style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }}
                />
                <div>
                  <p
                    className="text-xs mb-1"
                    style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}
                  >
                    Forma
                  </p>
                  <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>
                    {room.shapes.length} segmento{room.shapes.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {metadata?.description && (
                <div className="flex items-start gap-2">
                  <Info
                    className="w-4 h-4 mt-1 flex-shrink-0"
                    style={{ color: isDark ? "#C8E6FA/60" : "#0e3a6c/60" }}
                  />
                  <div>
                    <p
                      className="text-xs mb-1"
                      style={{ color: isDark ? "#E5F6FF/60" : "#0e3a6c/60" }}
                    >
                      Descrição
                    </p>
                    <p style={{ color: isDark ? "#C8E6FA" : "#0e3a6c" }}>{metadata.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
