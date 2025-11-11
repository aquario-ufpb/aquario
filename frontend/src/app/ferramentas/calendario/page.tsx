"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useMemo, useRef } from "react";
import { usePaasCalendar } from "@/hooks";
import { DAY_NUMBERS, CALENDAR_TIME_SLOTS, CLASS_COLORS } from "@/lib/calendario/constants";
import { parseHorarioToSlots } from "@/lib/calendario/utils";
import type { PaasRoom } from "@/lib/types";
import CalendarioHeader from "@/components/pages/calendario/header";
import SearchSection from "@/components/pages/calendario/search-section";
import CalendarGrid from "@/components/pages/calendario/calendar-grid";
import type { ClassWithRoom } from "@/components/pages/calendario/types";

export default function CalendarioPage() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data, isLoading, error } = usePaasCalendar("CI");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<Set<number>>(new Set());
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;

  // Extract all classes with room information
  const allClasses = useMemo(() => {
    if (!data?.solution?.solution) {
      return [];
    }

    const classes: ClassWithRoom[] = [];
    data.solution.solution.forEach((room: PaasRoom) => {
      if (room.classes && room.classes.length > 0) {
        room.classes.forEach(classItem => {
          classes.push({
            ...classItem,
            room: {
              bloco: room.bloco,
              nome: room.nome,
            },
          });
        });
      }
    });
    return classes;
  }, [data]);

  // Filter classes based on search query
  const filteredClasses = useMemo(() => {
    if (!searchQuery.trim()) {
      return allClasses;
    }

    const query = searchQuery
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return allClasses.filter(classItem => {
      const codigo = classItem.codigo.toLowerCase();
      const nome = classItem.nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const docente =
        classItem.docente
          ?.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") || "";
      const location = `${classItem.room.bloco} ${classItem.room.nome}`.toLowerCase();
      const horario = classItem.horario.toLowerCase();

      return (
        codigo.includes(query) ||
        nome.includes(query) ||
        docente.includes(query) ||
        location.includes(query) ||
        horario.includes(query)
      );
    });
  }, [allClasses, searchQuery]);

  // Get selected classes
  const selectedClasses = useMemo(() => {
    return allClasses.filter(c => selectedClassIds.has(c.id));
  }, [allClasses, selectedClassIds]);

  const toggleClassSelection = (classId: number) => {
    const newSet = new Set(selectedClassIds);
    if (newSet.has(classId)) {
      newSet.delete(classId);
    } else {
      newSet.add(classId);
    }
    setSelectedClassIds(newSet);
  };

  const clearSelection = () => {
    setSelectedClassIds(new Set());
    setShowCalendar(false);
  };

  const handleShowCalendar = () => {
    if (selectedClasses.length > 0) {
      setShowCalendar(true);
      // Scroll to calendar after a short delay to ensure it's rendered
      setTimeout(() => {
        calendarRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  // Generate colors for classes - must be before early returns
  const classColors = useMemo(() => {
    const colorMap = new Map<number, string>();
    selectedClasses.forEach((classItem, index) => {
      colorMap.set(classItem.id, CLASS_COLORS[index % CLASS_COLORS.length]);
    });
    return colorMap;
  }, [selectedClasses]);

  // Find all conflicts (overlapping classes)
  const conflicts = useMemo(() => {
    const conflictList: Array<{
      day: number;
      timeSlot: number;
      classes: ClassWithRoom[];
    }> = [];

    DAY_NUMBERS.forEach(day => {
      CALENDAR_TIME_SLOTS.forEach(timeSlot => {
        const slotClasses = selectedClasses.filter(classItem => {
          const slots = parseHorarioToSlots(classItem.horario);
          return slots.some(slot => {
            const timeSlotData = CALENDAR_TIME_SLOTS[timeSlot.index - 1];
            if (!timeSlotData) {
              return false;
            }
            return (
              slot.day === day &&
              slot.period === timeSlotData.period &&
              slot.slotInPeriod === timeSlotData.slot
            );
          });
        });
        if (slotClasses.length > 1) {
          conflictList.push({
            day,
            timeSlot: timeSlot.index,
            classes: slotClasses,
          });
        }
      });
    });

    return conflictList;
  }, [selectedClasses]);

  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div
        className="container mx-auto p-8 mt-20"
        style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}
      >
        <div className="text-center">
          <p className="text-lg">Carregando dados do calendário...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="container mx-auto p-8 mt-20"
        style={{ color: isDark ? "#FFB3B5" : "#d32f2f" }}
      >
        <div className="text-center">
          <p className="text-lg">Erro ao carregar dados: {error?.message || "Erro desconhecido"}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="container mx-auto p-8 mt-20"
        style={{ color: isDark ? "#E5F6FF" : "#0e3a6c" }}
      >
        <div className="text-center">
          <p className="text-lg">Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl mt-20">
      <CalendarioHeader data={data} isDark={isDark} />

      <SearchSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filteredClasses={filteredClasses}
        selectedClassIds={selectedClassIds}
        selectedClasses={selectedClasses}
        onToggleClass={toggleClassSelection}
        onShowCalendar={handleShowCalendar}
        onClearSelection={clearSelection}
        isDark={isDark}
      />

      {showCalendar && selectedClasses.length > 0 && (
        <CalendarGrid
          selectedClasses={selectedClasses}
          classColors={classColors}
          conflicts={conflicts}
          isDark={isDark}
          calendarRef={calendarRef}
        />
      )}
    </div>
  );
}
