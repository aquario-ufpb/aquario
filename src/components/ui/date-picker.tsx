"use client";

import * as React from "react";
import { format, parse } from "date-fns";
import type { Matcher } from "react-day-picker";
import { ptBR } from "date-fns/locale/pt-BR";
import { CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/client/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DatePickerProps = {
  /** Current value in "YYYY-MM-DD" format, or "" for empty */
  value: string;
  /** Callback with new value in "YYYY-MM-DD" format, or "" when cleared */
  onChange: (value: string) => void;
  /** Minimum selectable date in "YYYY-MM-DD" format */
  min?: string;
  /** Maximum selectable date in "YYYY-MM-DD" format */
  max?: string;
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Whether the date can be cleared (default: true) */
  clearable?: boolean;
  /** Additional className for the trigger button */
  className?: string;
  /** HTML id for the trigger button (for label association) */
  id?: string;
  /** Whether the field is required (visual indicator only) */
  required?: boolean;
};

function parseDate(dateStr: string): Date | undefined {
  if (!dateStr) {
    return undefined;
  }
  return parse(dateStr, "yyyy-MM-dd", new Date());
}

function formatDateValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Selecionar data",
  disabled = false,
  clearable = true,
  className,
  id,
  required = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = parseDate(value);
  const minDate = parseDate(min ?? "");
  const maxDate = parseDate(max ?? "");

  const disabledDays: Matcher[] = [];
  if (minDate) {
    disabledDays.push({ before: minDate });
  }
  if (maxDate) {
    disabledDays.push({ after: maxDate });
  }

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(formatDateValue(date));
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-required={required || undefined}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {selectedDate ? (
            <span className="truncate">{format(selectedDate, "dd/MM/yyyy")}</span>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
          {clearable && selectedDate && (
            <X
              className="ml-auto h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={disabledDays.length > 0 ? disabledDays : undefined}
          defaultMonth={selectedDate ?? minDate}
          locale={ptBR}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
